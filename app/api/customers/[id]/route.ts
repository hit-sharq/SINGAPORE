import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  notes: z.string().optional().nullable(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const customerInclude: any = {
      orders: {
        include: { order: { include: { items: { include: { product: true } }, payments: true } } },
        orderBy: { createdAt: 'desc' },
      },
      notes: { orderBy: { createdAt: 'desc' } },
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      // @ts-ignore - Prisma relations not in schema
      include: customerInclude,
    }) as any

    if (!customer) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Customer not found', 404, undefined, getPath(request))
    }

    return successResponse({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        createdAt: customer.createdAt.toISOString(),
        orders: (customer.orders as any[]).map((co) => ({
          id: co.order.id,
          number: co.order.number,
          status: co.order.status,
          total: co.order.total.toString(),
          createdAt: co.order.createdAt.toISOString(),
          items: (co.order.items as any[]).map((i) => ({
            name: i.product.name,
            qty: i.quantity.toString(),
            price: i.unitPrice.toString(),
          })),
          payments: (co.order.payments as any[]).map((p) => ({ method: p.method, amount: p.amount.toString() })),
        })),
        customerNotes: (customer.notes as any[]).map((n) => ({
          id: n.id,
          note: n.note,
          createdBy: n.createdBy,
          createdAt: n.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view this customer', 403, undefined, getPath(request))
    }
    console.error('GET /api/customers/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load customer', 500, undefined, getPath(request))
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid customer data', 400, parsed.error.issues, getPath(request))
    }

    const { name, phone, email, notes } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (notes !== undefined) updateData.notes = notes

    if (phone) {
      const existing = await prisma.customer.findFirst({ where: { phone, NOT: { id } } })
      if (existing) {
        return errorResponse(ErrorCodes.CONFLICT, 'A customer with this phone already exists', 400, { field: 'phone' }, getPath(request))
      }
    }
    if (email) {
      const existing = await prisma.customer.findFirst({ where: { email, NOT: { id } } })
      if (existing) {
        return errorResponse(ErrorCodes.CONFLICT, 'A customer with this email already exists', 400, { field: 'email' }, getPath(request))
      }
    }

    const customer = await prisma.customer.update({ where: { id }, data: updateData })
    return successResponse({ customer })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to update customers', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid customer data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/customers/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update customer', 500, undefined, getPath(request))
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params

    await prisma.customer.delete({ where: { id } })
    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can delete customers', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/customers/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete customer', 500, undefined, getPath(request))
  }
}