import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, OrderStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

function formatOrder(order: any) {
  const paidAmount = order.payments
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: any, p: any) => sum.plus(p.amount), new Prisma.Decimal(0))
  const outstanding = order.total.minus(paidAmount)

  return {
    ...order,
    total: order.total.toString(),
    items: order.items.map((item: any) => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
      subtotal: item.subtotal.toString(),
      quantity: item.quantity.toString(),
      product: {
        ...item.product,
        price: item.product.price.toString(),
        costPrice: item.product.costPrice.toString(),
        stock: item.product.stock.toString(),
        reorderAt: item.product.reorderAt.toString(),
      },
    })),
    payments: order.payments.map((p: any) => ({
      ...p,
      amount: p.amount.toString(),
    })),
    outstanding: outstanding.toString(),
    paidAmount: paidAmount.toString(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole(Object.values(Role))
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { category: true } } } },
        payments: { orderBy: { createdAt: 'desc' } },
        table: true,
        createdBy: { select: { name: true, email: true } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Order not found', 404, undefined, getPath(request))
    }

    return successResponse({ order: formatOrder(order) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view this order', 403, undefined, getPath(request))
    }
    console.error('GET /api/orders/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load order', 500, undefined, getPath(request))
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER])
    const { id } = await params
    const body = await request.json()
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid status data', 400, parsed.error.issues, getPath(request))
    }

    const { status } = parsed.data

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Order not found', 404, undefined, getPath(request))
    }

    if (order.status === 'VOID' || order.status === 'REFUNDED') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot modify voided or refunded order', 400, { field: 'status' }, getPath(request))
    }

    if (status === 'PAID' && order.status !== 'OPEN') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Only open orders can be marked paid', 400, { field: 'status' }, getPath(request))
    }

    if (status === 'VOID' && order.status !== 'OPEN') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Only open orders can be voided', 400, { field: 'status' }, getPath(request))
    }

    if (status === 'REFUNDED' && order.status !== 'PAID') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Only paid orders can be refunded', 400, { field: 'status' }, getPath(request))
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: { include: { product: true } },
          payments: true,
          table: true,
        },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: status,
          changedBy: staff.id,
        },
      })

      if (status === 'VOID') {
        for (const item of updatedOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              reason: `VOID_ORDER_${id}`,
              reference: id,
            },
          })
        }
        if (updatedOrder.tableId) {
          await tx.venueTable.update({
            where: { id: updatedOrder.tableId },
            data: { status: 'AVAILABLE' },
          })
        }
      }

      if (status === 'REFUNDED') {
        for (const payment of updatedOrder.payments) {
          if (payment.status === 'COMPLETED') {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'REFUNDED' },
            })
            await tx.paymentStatusHistory.create({
              data: {
                paymentId: payment.id,
                fromStatus: payment.status,
                toStatus: 'REFUNDED',
              },
            })
          }
        }
        if (updatedOrder.tableId) {
          await tx.venueTable.update({
            where: { id: updatedOrder.tableId },
            data: { status: 'AVAILABLE' },
          })
        }
      }

      return updatedOrder
    })

    return successResponse({ order: formatOrder(updated) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to update orders', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid status data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/orders/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update order', 500, undefined, getPath(request))
  }
}