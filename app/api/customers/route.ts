import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const customerInclude = {
      orders: { include: { order: { select: { createdAt: true } } } },
    } as any

    const customers = await prisma.customer.findMany({
      include: customerInclude,
      orderBy: { createdAt: 'desc' },
    }) as any

    return successResponse({
      customers: customers.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        orderCount: c.orders.length,
        lastOrder: c.orders[0]?.order?.createdAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view customers', 403, undefined, getPath(request))
    }
    console.error('GET /api/customers error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load customers', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const body = await request.json()
    const parsed = customerSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid customer data', 400, parsed.error.issues, getPath(request))
    }

    const { name, phone, email, notes } = parsed.data

    if (phone) {
      const existing = await prisma.customer.findUnique({ where: { phone } })
      if (existing) {
        return errorResponse(ErrorCodes.CONFLICT, 'A customer with this phone number already exists', 400, { field: 'phone' }, getPath(request))
      }
    }
    if (email) {
      const existing = await prisma.customer.findUnique({ where: { email } })
      if (existing) {
        return errorResponse(ErrorCodes.CONFLICT, 'A customer with this email already exists', 400, { field: 'email' }, getPath(request))
      }
    }

    const customer = await prisma.customer.create({
      data: { name, phone: phone || null, email: email || null, notes: notes || null },
    })

    return createdResponse({ customer })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to create customers', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid customer data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/customers error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create customer', 500, undefined, getPath(request))
  }
}