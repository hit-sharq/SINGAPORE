import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: { order: { include: { items: { include: { product: true } }, payments: true } } },
          orderBy: { createdAt: 'desc' },
        },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        createdAt: customer.createdAt.toISOString(),
        orders: customer.orders.map((co) => ({
          id: co.order.id,
          number: co.order.number,
          status: co.order.status,
          total: co.order.total.toString(),
          createdAt: co.order.createdAt.toISOString(),
          items: co.order.items.map((i) => ({
            name: i.product.name,
            qty: i.quantity.toString(),
            price: i.unitPrice.toString(),
          })),
          payments: co.order.payments.map((p) => ({ method: p.method, amount: p.amount.toString() })),
        })),
        notes: customer.notes.map((n) => ({
          id: n.id,
          note: n.note,
          createdBy: n.createdBy,
          createdAt: n.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load customer' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params
    const body = await request.json()
    const { name, phone, email, notes } = updateSchema.parse(body)

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (notes !== undefined) updateData.notes = notes

    if (phone) {
      const existing = await prisma.customer.findFirst({ where: { phone, NOT: { id } } })
      if (existing) return NextResponse.json({ error: 'Phone already exists' }, { status: 400 })
    }
    if (email) {
      const existing = await prisma.customer.findFirst({ where: { email, NOT: { id } } })
      if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const customer = await prisma.customer.update({ where: { id }, data: updateData })
    return NextResponse.json({ customer })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params

    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}