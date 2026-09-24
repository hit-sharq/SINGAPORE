import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, OrderStatus } from '@prisma/client'

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
})

export async function GET(
  request: Request,
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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const paidAmount = order.payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum.plus(p.amount), new (require('@prisma/client').Prisma.Decimal)(0))
    const outstanding = order.total.minus(paidAmount)

    return NextResponse.json({
      ...order,
      total: order.total.toString(),
      items: order.items.map((item) => ({
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
      payments: order.payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      })),
      outstanding: outstanding.toString(),
      paidAmount: paidAmount.toString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load order' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER])
    const { id } = await params
    const body = await request.json()
    const { status } = statusSchema.parse(body)

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.status === 'VOID' || order.status === 'REFUNDED') {
      return NextResponse.json({ error: 'Cannot modify voided or refunded order' }, { status: 400 })
    }

    if (status === 'PAID' && order.status !== 'OPEN') {
      return NextResponse.json({ error: 'Only open orders can be marked paid' }, { status: 400 })
    }

    if (status === 'VOID' && order.status !== 'OPEN') {
      return NextResponse.json({ error: 'Only open orders can be voided' }, { status: 400 })
    }

    if (status === 'REFUNDED' && order.status !== 'PAID') {
      return NextResponse.json({ error: 'Only paid orders can be refunded' }, { status: 400 })
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

    return NextResponse.json({
      ...updated,
      total: updated.total.toString(),
      items: updated.items.map((item) => ({
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
      payments: updated.payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to update order' }, { status: 500 })
  }
}