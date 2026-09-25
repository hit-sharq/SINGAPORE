import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const customers = await prisma.customer.findMany({
      include: {
        _count: { select: { orders: true } },
        orders: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        orderCount: c._count.orders,
        lastOrder: c.orders[0]?.createdAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load customers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const body = await request.json()
    const { name, phone, email, notes } = customerSchema.parse(body)

    if (phone) {
      const existing = await prisma.customer.findUnique({ where: { phone } })
      if (existing) return NextResponse.json({ error: 'Phone already exists' }, { status: 400 })
    }
    if (email) {
      const existing = await prisma.customer.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: { name, phone: phone || null, email: email || null, notes: notes || null },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}