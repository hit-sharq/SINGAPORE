import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, TableStatus } from '@prisma/client'

const statusSchema = z.object({
  status: z.nativeEnum(TableStatus),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  status: z.nativeEnum(TableStatus).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    const table = await prisma.venueTable.findUnique({ where: { id } })
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

    if (data.status && data.status !== table.status) {
      const openOrder = await prisma.order.findFirst({
        where: { tableId: id, status: 'OPEN' },
      })

      if (data.status === 'OCCUPIED' && !openOrder) {
        return NextResponse.json({ error: 'Cannot occupy table without an open order' }, { status: 400 })
      }

      if (data.status === 'AVAILABLE' && openOrder) {
        return NextResponse.json({ error: 'Table has an open order, close it first' }, { status: 400 })
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

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to update table' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const table = await prisma.venueTable.findUnique({ where: { id } })
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

    const openOrder = await prisma.order.findFirst({
      where: { tableId: id, status: 'OPEN' },
    })
    if (openOrder) {
      return NextResponse.json({ error: 'Cannot delete table with open order' }, { status: 400 })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to delete table' }, { status: 500 })
  }
}