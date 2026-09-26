import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const orderSchema = z.object({
  tableId: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().positive().finite() })).min(1, 'At least one item required'),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    const staff = await requireRole(Object.values(Role))
    const orders = await prisma.order.findMany({
      where: { createdById: staff.id },
      include: { items: { include: { product: true } }, payments: true, table: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return successResponse({ orders })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view orders', 403, undefined, getPath(request))
    }
    console.error('GET /api/orders error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load orders', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const body = await request.json()
    const parsed = orderSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid order data', 400, parsed.error.issues, getPath(request))
    }

    const input = parsed.data

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: input.items.map((item) => item.productId) }, status: 'ACTIVE' } })
      if (products.length !== input.items.length) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'One or more products not found or inactive', 400, undefined, getPath(request))
      }
      const items = input.items.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId)!
        if (product.stock.lessThan(item.quantity)) {
          throw new Error('INSUFFICIENT_STOCK')
        }
        const subtotal = product.price.mul(item.quantity)
        return { productId: product.id, quantity: item.quantity, unitPrice: product.price, subtotal }
      })
      const total = items.reduce((sum, item) => sum.plus(item.subtotal), new Prisma.Decimal(0))
      const created = await tx.order.create({
        data: { createdById: staff.id, tableId: input.tableId, total, items: { create: items } },
        include: { items: true },
      })
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
      }
      return created
    })

    return createdResponse({ order })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to create orders', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid order data', 400, error.issues, getPath(request))
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Insufficient stock for one or more items', 400, undefined, getPath(request))
    }
    console.error('POST /api/orders error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create order', 500, undefined, getPath(request))
  }
}