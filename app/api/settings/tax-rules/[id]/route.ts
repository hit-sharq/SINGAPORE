import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const taxSchema = z.object({
  name: z.string().min(1).optional(),
  rate: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params
    const body = await request.json()
    const { name, rate, active } = taxSchema.parse(body)

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (rate !== undefined) updateData.rate = rate
    if (active !== undefined) updateData.active = active

    if (name) {
      const existing = await prisma.taxRule.findFirst({ where: { name, NOT: { id } } })
      if (existing) return NextResponse.json({ error: 'Tax rule with this name exists' }, { status: 400 })
    }

    const rule = await prisma.taxRule.update({ where: { id }, data: updateData })
    return NextResponse.json({ rule: { id: rule.id, name: rule.name, rate: rule.rate.toString(), active: rule.active } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update tax rule' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params
    await prisma.taxRule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to delete tax rule' }, { status: 500 })
  }
}