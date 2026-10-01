import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'
import { revalidateTag } from 'next/cache'
import { markTableOccupied } from '@/lib/tables'

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
    // Every order in the club, not just the ones this staff member opened.
    // Filtering on createdById made the Orders page look empty whenever the
    // tab had been started by someone else — which on a busy floor is most of
    // them — and left a manager unable to see what the team is serving.
    const orders = await prisma.order.findMany({
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

    // A malformed body should be a clear 400 rather than a 500 from a JSON
    // parse error, and the reason belongs in the log so a rejected order can
    // be diagnosed from the server output instead of guessed at.
    let body: unknown
    try {
      body = await request.json()
    } catch {
      console.error('POST /api/orders: body was not valid JSON')
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Expected a JSON body',
        400,
        undefined,
        getPath(request)
      )
    }

    const parsed = orderSchema.safeParse(body)

    if (!parsed.success) {
      console.error('POST /api/orders: schema rejected the payload', parsed.error.issues)
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid order data', 400, parsed.error.issues, getPath(request))
    }

    const input = parsed.data

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: input.items.map((item) => item.productId) }, status: 'ACTIVE' } })
      if (products.length !== input.items.length) {
        // Name the offending products. A generic "one or more products not
        // found" gives the waiter nothing to act on, and this is the 400 a
        // sale actually hits when an item was deactivated or deleted while it
        // sat in the cart.
        const found = new Set(products.map((product) => product.id))
        const missing = input.items.filter((item) => !found.has(item.productId))
        console.error(
          'POST /api/orders: products not found or inactive',
          missing.map((item) => item.productId)
        )
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          missing.length === 1
            ? 'One item is no longer available. Remove it from the cart and try again.'
            : `${missing.length} items are no longer available. Remove them from the cart and try again.`,
          400,
          { productIds: missing.map((item) => item.productId) },
          getPath(request)
        )
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

      // A table with an open order against it is occupied. Without this the
      // floor showed "Ready for a new session" while a tab was running, and
      // the next waiter could seat a new party on top of it.
      if (input.tableId) {
        await markTableOccupied(tx, input.tableId)
      }

      return created
    })

    revalidateTag('dashboard', 'max')
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