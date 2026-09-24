import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const orderSchema = z.object({
  tableId: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().positive().finite() })).min(1),
})

export async function GET() {
  try {
    const staff = await requireRole(Object.values(Role))
    const orders = await prisma.order.findMany({ where: { createdById: staff.id }, include: { items: { include: { product: true } }, payments: true, table: true }, orderBy: { createdAt: 'desc' }, take: 100 })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === 'FORBIDDEN' ? 'Forbidden' : 'Unable to load orders' }, { status: error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const input = orderSchema.parse(await request.json())
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: input.items.map((item) => item.productId) }, status: 'ACTIVE' } })
      if (products.length !== input.items.length) throw new Error('INVALID_PRODUCTS')
      const items = input.items.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId)!
        if (product.stock.lessThan(item.quantity)) throw new Error('INSUFFICIENT_STOCK')
        const subtotal = product.price.mul(item.quantity)
        return { productId: product.id, quantity: item.quantity, unitPrice: product.price, subtotal }
      })
      const total = items.reduce((sum, item) => sum.plus(item.subtotal), new (require('@prisma/client').Prisma.Decimal)(0))
      const created = await tx.order.create({ data: { createdById: staff.id, tableId: input.tableId, total, items: { create: items } }, include: { items: true } })
      for (const item of items) await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
      return created
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create order'
    const status = ['FORBIDDEN', 'INVALID_PRODUCTS', 'INSUFFICIENT_STOCK'].includes(message) ? (message === 'FORBIDDEN' ? 403 : 400) : 500
    return NextResponse.json({ error: status === 500 ? 'Unable to create order' : message }, { status })
  }
}
