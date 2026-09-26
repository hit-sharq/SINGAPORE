import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, OrderStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const orderTrackingId = url.searchParams.get('OrderTrackingId')
  const merchantReference = url.searchParams.get('OrderMerchantReference')

  if (!orderTrackingId && !merchantReference) {
    return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 })
  }

  try {
    // Find the PesapalTransaction by either reference
    const transaction = orderTrackingId
      ? await prisma.pesapalTransaction.findFirst({ where: { pesapalOrderId: orderTrackingId } })
      : await prisma.pesapalTransaction.findUnique({ where: { merchantRef: merchantReference! } })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Determine final status from PesaPal response
    const pesapalStatus = (transaction.callbackPayload as any)?.status
    let newPaymentStatus: PaymentStatus | null = null

    if (pesapalStatus === 'Completed') {
      newPaymentStatus = PaymentStatus.COMPLETED
    } else if (pesapalStatus === 'Failed' || pesapalStatus === 'Invalid') {
      newPaymentStatus = PaymentStatus.FAILED
    } else if (pesapalStatus === 'Refunded') {
      newPaymentStatus = PaymentStatus.REFUNDED
    }

    if (newPaymentStatus && transaction.status !== newPaymentStatus) {
      await prisma.$transaction(async (tx) => {
        // Update PesapalTransaction status
        await tx.pesapalTransaction.update({
          where: { id: transaction.id },
          data: { status: newPaymentStatus },
        })

        // Update the linked Payment record
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

          // If payment completed, mark order PAID
          if (newPaymentStatus === PaymentStatus.COMPLETED) {
            const order = await tx.order.findUnique({
              where: { id: payment.orderId },
              include: { payments: true },
            })
            if (order) {
              const paidAmount = order.payments
                .filter((p) => p.id !== payment.id || newPaymentStatus === PaymentStatus.COMPLETED)
                .reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0))
              if (paidAmount.greaterThanOrEqualTo(order.total) && order.status === 'OPEN') {
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

    return NextResponse.json({
      orderTrackingId,
      merchantReference,
      status: transaction.status,
    })
  } catch (error) {
    console.error('PesaPal IPN error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}