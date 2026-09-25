import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import {
  pesapalGetAuthToken,
  pesapalSubmitOrder,
  PesapalError,
} from '@/lib/pesapal'
import { Role, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client'

const paymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('KES'),
  pesapalOrderId: z.string().optional(),
  merchantRef: z.string().optional(),
})

const PESA_PAL_REDIRECT_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/callback`
  : undefined

function generateMerchantRef(orderNumber: number, paymentId: string): string {
  return `ORD-${orderNumber}-${paymentId.slice(-6).toUpperCase()}`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const { method, amount, currency, pesapalOrderId, merchantRef } = paymentSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const paidAmount = order.payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum.plus(p.amount), new (require('@prisma/client').Prisma.Decimal)(0))
    const outstanding = order.total.minus(paidAmount)

    const paymentAmount = new (require('@prisma/client').Prisma.Decimal)(amount)
    if (paymentAmount.greaterThan(outstanding)) {
      return NextResponse.json({ error: `Payment exceeds outstanding amount (${outstanding.toString()})` }, { status: 400 })
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: id,
          method,
          amount: paymentAmount,
          currency,
          status: method === 'PESAPAL' ? PaymentStatus.PENDING : PaymentStatus.COMPLETED,
          pesapalOrderId,
          merchantRef,
        },
      })

      await tx.paymentStatusHistory.create({
        data: {
          paymentId: created.id,
          fromStatus: undefined,
          toStatus: created.status,
        },
      })

      const newPaidAmount = paidAmount.plus(paymentAmount)
      if (newPaidAmount.greaterThanOrEqualTo(order.total)) {
        await tx.order.update({
          where: { id },
          data: { status: OrderStatus.PAID },
        })
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: order.status,
            toStatus: OrderStatus.PAID,
            changedBy: staff.id,
          },
        })
        if (order.tableId) {
          await tx.venueTable.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' },
          })
        }
      }

      return created
    })

    // If PesaPal, initiate the actual gateway call
    if (method === 'PESAPAL') {
      try {
        const [keySetting, secretSetting, ipnSetting] = await Promise.all([
          prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_key' } }),
          prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_secret' } }),
          prisma.appSetting.findUnique({ where: { key: 'pesapal_ipn_url' } }),
        ])
        // Env vars take precedence; fall back to database config
        const consumerKey = process.env.PESAPAL_CONSUMER_KEY || keySetting?.value
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || secretSetting?.value
        const ipnUrl = ipnSetting?.value

        if (!consumerKey || !consumerSecret) {
          return NextResponse.json({
            ...payment,
            amount: payment.amount.toString(),
            warning: 'PesaPal credentials not configured',
          })
        }

        const merchantRef = generateMerchantRef(order.number, payment.id)
        const callbackUrl = ipnUrl || PESA_PAL_REDIRECT_URL
        if (!callbackUrl) {
          return NextResponse.json({
            ...payment,
            amount: payment.amount.toString(),
            warning: 'No callback URL configured',
          })
        }
        const redirectUrl = callbackUrl

        const result = await pesapalSubmitOrder({
          consumerKey,
          consumerSecret,
          merchantRef,
          amount: Number(payment.amount),
          currency: payment.currency,
          description: `Order #${order.number}`,
          callbackUrl,
          notificationUrl: callbackUrl,
          redirectUrl,
        })

        await prisma.pesapalTransaction.create({
          data: {
            orderId: id,
            merchantRef,
            pesapalOrderId: result.pesapal_transaction_id,
            status: result.status === 'Completed' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
            amount: payment.amount,
            currency: payment.currency,
            callbackPayload: result as any,
          },
        })

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            merchantRef,
            pesapalOrderId: result.pesapal_transaction_id,
            confirmationRef: result.pesapal_transaction_id,
            rawResponse: result as any,
          },
        })

        return NextResponse.json({
          ...payment,
          amount: payment.amount.toString(),
          merchantRef,
          pesapalOrderId: result.pesapal_transaction_id,
          redirectUrl: result.redirect_url,
        })
      } catch (err) {
        if (err instanceof PesapalError) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.FAILED,
              rawResponse: { error: err.message } as any,
            },
          })
          await prisma.paymentStatusHistory.create({
            data: {
              paymentId: payment.id,
              fromStatus: PaymentStatus.PENDING,
              toStatus: PaymentStatus.FAILED,
            },
          })
          return NextResponse.json({
            ...payment,
            amount: payment.amount.toString(),
            error: err.message,
          }, { status: 502 })
        }
        throw err
      }
    }

    return NextResponse.json({
      ...payment,
      amount: payment.amount.toString(),
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to process payment' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole(Object.values(Role))
    const { id } = await params

    const payments = await prisma.payment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments.map((p) => ({ ...p, amount: p.amount.toString() })))
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load payments' }, { status: 500 })
  }
}