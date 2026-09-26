import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, TableStatus } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const tableSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer').default(4),
  status: z.nativeEnum(TableStatus).default('AVAILABLE'),
})

const statusSchema = z.object({
  status: z.nativeEnum(TableStatus),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

function formatTable(table: any) {
  return {
    ...table,
    capacity: table.capacity,
    orders: table.orders?.map((order: any) => ({
      ...order,
      total: order.total.toString(),
      payments: order.payments,
    })) ?? [],
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(Object.values(Role))
    const tables = await prisma.venueTable.findMany({
      orderBy: { name: 'asc' },
      include: {
        orders: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: { payments: { select: { method: true, status: true } } },
        },
      },
    })

    return successResponse({
      tables: tables.map(formatTable),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view tables', 403, undefined, getPath(request))
    }
    console.error('GET /api/tables error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load tables', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const body = await request.json()
    const parsed = tableSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid table data', 400, parsed.error.issues, getPath(request))
    }

    const { name, capacity, status } = parsed.data

    const table = await prisma.venueTable.create({
      data: { name, capacity, status },
    })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'CREATE_TABLE',
        entity: 'VenueTable',
        entityId: table.id,
        metadata: { name, capacity, status },
      },
    })

    return createdResponse({ table })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to create tables', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid table data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/tables error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create table', 500, undefined, getPath(request))
  }
}