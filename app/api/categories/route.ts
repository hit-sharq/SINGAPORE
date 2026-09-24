import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const categorySchema = z.object({
  name: z.string().min(1),
})

export async function GET() {
  try {
    const staff = await requireRole(Object.values(Role))
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return NextResponse.json(categories)
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const body = await request.json()
    const { name } = categorySchema.parse(body)

    const existing = await prisma.category.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
    }

    const category = await prisma.category.create({ data: { name } })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'CREATE_CATEGORY',
        entity: 'Category',
        entityId: category.id,
        metadata: { name },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to create category' }, { status: 500 })
  }
}