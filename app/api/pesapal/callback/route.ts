import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, OrderStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { enforceRateLimit, LIMITS } from '@/lib/rate-limit'
import { verifyTransactionWithPesapal, toPaymentStatus } from '@/lib/pesapal-verify'
import { releaseTableIfFree } from '@/lib/tables'

/**
 * PesaPal callback — the page the customer's browser lands on after paying.
 *
 * Unlike the IPN, this arrives through the browser, so it is the least
 * trustworthy entry point in the system. It is also the one that decides what
 * the customer sees, so it still has to work.
 *
 * The parameters are treated as a pointer only. The payment status is confirmed
 * against PesaPal's API, and the reported amount must match what we recorded,
 * before an order is marked paid.
 *
 * This route used to read `status` from the query string and mark the payment
 * COMPLETED, which meant anyone who could reach the URL with a valid-looking
 * tracking id could mark an order paid.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)

  const limited = enforceRateLimit(request, LIMITS.webhook, 'pesapal-callback')
  if (limited) return limited

  const orderTrackingId =
    url.searchParams.get('OrderTrackingId') ||
    url.searchParams.get('pesapal_transaction_tracking_id')
  const merchantReference =
    url.searchParams.get('OrderMerchantReference') ||
    url.searchParams.get('pesapal_merchant_reference')

  if (!orderTrackingId && !merchantReference) {
    return NextResponse.redirect(new URL('/?payment=error', url.origin))
  }

  try {
    const transaction = orderTrackingId
      ? await prisma.pesapalTransaction.findFirst({ where: { pesapalOrderId: orderTrackingId } })
      : await prisma.pesapalTransaction.findUnique({ where: { merchantRef: merchantReference! } })

    if (!transaction) {
      return NextResponse.redirect(new URL('/?payment=error', url.origin))
    }

    if (!transaction.pesapalOrderId) {
      return NextResponse.redirect(new URL('/?payment=error', url.origin))
    }

    // Mobile money often confirms a few seconds after the browser is redirected
    // back, so a pending result here is normal rather than an error.
    const verified = await verifyTransactionWithPesapal(
      transaction.pesapalOrderId,
      transaction.amount.toNumber(),
    )

    if (!verified.ok) {
      console.warn(
        `PesaPal callback rejected for ${transaction.merchantRef}: ${verified.reason}`
      )
      return NextResponse.redirect(new URL('/?payment=error', url.origin))
    }

    const newPaymentStatus = toPaymentStatus(verified.status)

    if (newPaymentStatus && transaction.status !== newPaymentStatus) {
      await prisma.$transaction(async (tx) => {
        await tx.pesapalTransaction.update({
          where: { id: transaction.id },
          data: {
            status: newPaymentStatus,
            callbackPayload: {
              verifiedWith: 'pesapal-api',
              status: verified.status,
              amount: verified.amount,
            },
          },
        })

        const payment = await tx.payment.findFirst({
          where: { merchantRef: transaction.merchantRef },
        })

        if (!payment || payment.status === newPaymentStatus) return

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        })
        await tx.paymentStatusHistory.create({
          data: {
            paymentId: payment.id,
            fromStatus: payment.status,
            toStatus: newPaymentStatus,
          },
        })

        if (newPaymentStatus === PaymentStatus.COMPLETED) {
          const order = await tx.order.findUnique({
            where: { id: payment.orderId },
            include: { payments: true },
          })

          if (order && order.status === 'OPEN') {
            const paidAmount = order.payments
              .filter((p) => p.id === payment.id || p.status === 'COMPLETED')
              .reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0))

            if (paidAmount.greaterThanOrEqualTo(order.total)) {
              await tx.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.PAID },
              })
              await tx.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  fromStatus: order.status,
                  toStatus: OrderStatus.PAID,
                  changedBy: 'pesapal-callback',
                },
              })

              if (order.tableId) {
                await releaseTableIfFree(tx, order.tableId)
              }
            }
          }
        }
      })
    }

    const settled = newPaymentStatus === PaymentStatus.COMPLETED
    return NextResponse.redirect(
      new URL(settled ? '/?payment=success' : '/?payment=pending', url.origin),
    )
  } catch (error) {
    console.error('PesaPal callback error:', error)
    return NextResponse.redirect(new URL('/?payment=error', url.origin))
  }
}
