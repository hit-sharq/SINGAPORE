import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const discountSchema = z.object({
  name: z.string().min(1),
  percentage: z.number().min(0).max(100),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const rules = await prisma.discountRule.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ rules: rules.map((r) => ({ id: r.id, name: r.name, percentage: r.percentage.toString(), active: r.active })) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load discount rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const { name, percentage, active } = discountSchema.parse(body)

    const existing = await prisma.discountRule.findUnique({ where: { name } })
    if (existing) return NextResponse.json({ error: 'Discount rule with this name exists' }, { status: 400 })

    const rule = await prisma.discountRule.create({ data: { name, percentage, active: active ?? true } })
    return NextResponse.json({ rule: { id: rule.id, name: rule.name, percentage: rule.percentage.toString(), active: rule.active } }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create discount rule' }, { status: 500 })
  }
}