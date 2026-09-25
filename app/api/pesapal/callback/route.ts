import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, OrderStatus } from '@prisma/client'

/**
 * PesaPal callback endpoint — receives the payment result and updates the Payment record.
 * This is a public route (no auth) — whitelisted in proxy.ts.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const orderTrackingId = url.searchParams.get('OrderTrackingId')
  const merchantReference = url.searchParams.get('OrderMerchantReference')
  const status = url.searchParams.get('status')

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

    let newPaymentStatus: PaymentStatus | null = null
    if (status === 'Completed' || (transaction.callbackPayload as any)?.status === 'Completed') {
      newPaymentStatus = PaymentStatus.COMPLETED
    } else if (status === 'Failed' || status === 'Invalid') {
      newPaymentStatus = PaymentStatus.FAILED
    } else if (status === 'Refunded') {
      newPaymentStatus = PaymentStatus.REFUNDED
    }

    if (newPaymentStatus && transaction.status !== newPaymentStatus) {
      await prisma.$transaction(async (tx) => {
        await tx.pesapalTransaction.update({
          where: { id: transaction.id },
          data: { status: newPaymentStatus },
        })

        const payment = await tx.payment.findFirst({
          where: { merchantRef: transaction.merchantRef },
        })

        if (payment && payment.status !== newPaymentStatus) {
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
                .filter((p) => p.status === 'COMPLETED' || p.id === payment.id)
                .reduce((sum, p) => sum.plus(p.amount), new (require('@prisma/client').Prisma.Decimal)(0))
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
                    changedBy: 'system',
                  },
                })
                if (order.tableId) {
                  await tx.venueTable.update({
                    where: { id: order.tableId },
                    data: { status: 'AVAILABLE' },
                  })
                }
              }
            }
          }
        }
      })
    }

    return NextResponse.redirect(new URL('/?payment=success', url.origin))
  } catch (error) {
    console.error('PesaPal callback error:', error)
    return NextResponse.redirect(new URL('/?payment=error', url.origin))
  }
}