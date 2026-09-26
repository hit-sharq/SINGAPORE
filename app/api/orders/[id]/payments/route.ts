import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import {
  pesapalGetAuthToken,
  pesapalSubmitOrder,
  PesapalError,
} from '@/lib/pesapal'
import { Role, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const paymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
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

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

function formatPayment(payment: any) {
  return {
    ...payment,
    amount: payment.amount.toString(),
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid payment data', 400, parsed.error.issues, getPath(request))
    }

    const { method, amount, currency, pesapalOrderId, merchantRef } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Order not found', 404, undefined, getPath(request))
    }

    const paidAmount = order.payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0))
    const outstanding = order.total.minus(paidAmount)

    const paymentAmount = new Prisma.Decimal(amount)
    if (paymentAmount.greaterThan(outstanding)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Payment exceeds outstanding amount (${outstanding.toString()})`,
        400,
        { field: 'amount', outstanding: outstanding.toString() },
        getPath(request)
      )
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
          return successResponse({
            ...formatPayment(payment),
            warning: 'PesaPal credentials not configured',
          })
        }

        const merchantRef = generateMerchantRef(order.number, payment.id)
        const callbackUrl = ipnUrl || PESA_PAL_REDIRECT_URL
        if (!callbackUrl) {
          return successResponse({
            ...formatPayment(payment),
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

        return successResponse({
          ...formatPayment(payment),
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
          return errorResponse(
            ErrorCodes.SERVICE_UNAVAILABLE,
            err.message,
            502,
            { payment: formatPayment(payment), error: err.message },
            getPath(request)
          )
        }
        throw err
      }
    }

    return createdResponse(formatPayment(payment))
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to process payments', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid payment data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/orders/[id]/payments error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to process payment', 500, undefined, getPath(request))
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(Object.values(Role))
    const { id } = await params

    const payments = await prisma.payment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({
      payments: payments.map(formatPayment),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view payments', 403, undefined, getPath(request))
    }
    console.error('GET /api/orders/[id]/payments error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load payments', 500, undefined, getPath(request))
  }
}