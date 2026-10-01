import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, OrderStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { enforceRateLimit, LIMITS } from '@/lib/rate-limit'
import { verifyTransactionWithPesapal, toPaymentStatus } from '@/lib/pesapal-verify'

/**
 * PesaPal IPN — the provider's server-to-server status notification.
 *
 * This route is public, because PesaPal has no session. PesaPal does not sign
 * its IPN, so nothing in the request can be trusted: the parameters are only a
 * pointer to a transaction. The status is confirmed with PesaPal's own API
 * before anything is written, and the reported amount must match the amount we
 * recorded when the payment was created.
 *
 * PesaPal expects a 200 with the same three parameters echoed back, and retries
 * a limited number of times when it does not get one.
 */
export async function GET(request: NextRequest) {
  // Rate limit before any database or network work.
  const limited = enforceRateLimit(request, LIMITS.webhook, 'pesapal-ipn')
  if (limited) return limited

  const url = new URL(request.url)
  const orderTrackingId =
    url.searchParams.get('OrderTrackingId') ||
    url.searchParams.get('pesapal_transaction_tracking_id')
  const merchantReference =
    url.searchParams.get('OrderMerchantReference') ||
    url.searchParams.get('pesapal_merchant_reference')

  if (!orderTrackingId && !merchantReference) {
    return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 })
  }

  try {
    const transaction = orderTrackingId
      ? await prisma.pesapalTransaction.findFirst({ where: { pesapalOrderId: orderTrackingId } })
      : await prisma.pesapalTransaction.findUnique({ where: { merchantRef: merchantReference! } })

    if (!transaction) {
      // Nothing of ours to update. Acknowledge so PesaPal stops retrying.
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    // Without a tracking id we cannot ask PesaPal about the transaction.
    if (!transaction.pesapalOrderId) {
      return NextResponse.json({ error: 'Transaction has no PesaPal id yet' }, { status: 409 })
    }

    const expectedAmount = transaction.amount.toNumber()
    const verified = await verifyTransactionWithPesapal(transaction.pesapalOrderId, expectedAmount)

    if (!verified.ok) {
      // Includes a forged notification: the id does not exist at PesaPal, or
      // the amount does not match what we recorded.
      console.warn(
        `PesaPal IPN rejected for ${transaction.merchantRef}: ${verified.reason}`
      )
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 })
    }

    const newPaymentStatus = toPaymentStatus(verified.status)

    // Nothing to do while the payment is still pending — mobile money commonly
    // sits at PENDING for around 20 seconds.
    if (!newPaymentStatus) {
      return NextResponse.json({
        orderTrackingId: transaction.pesapalOrderId,
        merchantReference: transaction.merchantRef,
        status: transaction.status,
      })
    }

    if (transaction.status !== newPaymentStatus) {
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
            // Only completed payments count toward settling the order.
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
                  changedBy: 'pesapal-ipn',
                },
              })

              // Money confirmed: now the table can be released.
              if (order.tableId) {
                await tx.venueTable.update({
                  where: { id: order.tableId },
                  data: { status: 'AVAILABLE' },
                })
              }
            }
          }
        }
      })
    }

    // PesaPal retries unless it receives these parameters echoed back.
    return new NextResponse(
      `pesapal_notification_type=CHANGE` +
        `&pesapal_transaction_tracking_id=${encodeURIComponent(transaction.pesapalOrderId ?? '')}` +
        `&pesapal_merchant_reference=${encodeURIComponent(transaction.merchantRef)}`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    )
  } catch (error) {
    console.error('PesaPal IPN error:', error)
    // A 500 makes PesaPal retry, which is what we want for a transient failure.
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
