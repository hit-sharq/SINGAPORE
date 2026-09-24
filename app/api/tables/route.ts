import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, TableStatus } from '@prisma/client'

const tableSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive().default(4),
  status: z.nativeEnum(TableStatus).default('AVAILABLE'),
})

const statusSchema = z.object({
  status: z.nativeEnum(TableStatus),
})

export async function GET() {
  try {
    const staff = await requireRole(Object.values(Role))
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

    return NextResponse.json(
      tables.map((table) => ({
        ...table,
        capacity: table.capacity,
        orders: table.orders.map((order) => ({
          ...order,
          total: order.total.toString(),
          payments: order.payments,
        })),
      }))
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load tables' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const body = await request.json()
    const { name, capacity, status } = tableSchema.parse(body)

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

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to create table' }, { status: 500 })
  }
}