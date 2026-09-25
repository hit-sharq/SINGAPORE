import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const taxSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const rules = await prisma.taxRule.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ rules: rules.map((r) => ({ id: r.id, name: r.name, rate: r.rate.toString(), active: r.active })) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load tax rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const { name, rate, active } = taxSchema.parse(body)

    const existing = await prisma.taxRule.findUnique({ where: { name } })
    if (existing) return NextResponse.json({ error: 'Tax rule with this name exists' }, { status: 400 })

    const rule = await prisma.taxRule.create({ data: { name, rate, active: active ?? true } })
    return NextResponse.json({ rule: { id: rule.id, name: rule.name, rate: rule.rate.toString(), active: rule.active } }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create tax rule' }, { status: 500 })
  }
}