import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, TableStatus } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const statusSchema = z.object({
  status: z.nativeEnum(TableStatus),
})

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer').optional(),
  status: z.nativeEnum(TableStatus).optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid table data', 400, parsed.error.issues, getPath(request))
    }

    const data = parsed.data

    const table = await prisma.venueTable.findUnique({ where: { id } })
    if (!table) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Table not found', 404, undefined, getPath(request))
    }

    if (data.status && data.status !== table.status) {
      const openOrder = await prisma.order.findFirst({
        where: { tableId: id, status: 'OPEN' },
      })

      if (data.status === 'OCCUPIED' && !openOrder) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot occupy table without an open order', 400, { field: 'status' }, getPath(request))
      }

      if (data.status === 'AVAILABLE' && openOrder) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Table has an open order, close it first', 400, { field: 'status' }, getPath(request))
      }
    }

    const updated = await prisma.venueTable.update({
      where: { id },
      data,
      include: {
        orders: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: { payments: { select: { method: true, status: true } } },
        },
      },
    })

    if (data.status && data.status !== table.status) {
      await prisma.auditLog.create({
        data: {
          userId: staff.id,
          action: 'UPDATE_TABLE_STATUS',
          entity: 'VenueTable',
          entityId: id,
          metadata: { fromStatus: table.status, toStatus: data.status },
        },
      })
    }

    return successResponse({ table: formatTable(updated) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to update tables', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid table data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/tables/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update table', 500, undefined, getPath(request))
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const table = await prisma.venueTable.findUnique({ where: { id } })
    if (!table) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Table not found', 404, undefined, getPath(request))
    }

    const openOrder = await prisma.order.findFirst({
      where: { tableId: id, status: 'OPEN' },
    })
    if (openOrder) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot delete table with open order', 400, { field: 'table' }, getPath(request))
    }

    await prisma.venueTable.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'DELETE_TABLE',
        entity: 'VenueTable',
        entityId: id,
        metadata: { name: table.name },
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to delete tables', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/tables/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete table', 500, undefined, getPath(request))
  }
}