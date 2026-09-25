import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const printerSchema = z.object({
  name: z.string().min(1).optional(),
  endpoint: z.string().url().optional(),
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
    const { name, endpoint, active } = printerSchema.parse(body)

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (endpoint !== undefined) updateData.endpoint = endpoint
    if (active !== undefined) updateData.active = active

    const printer = await prisma.printerConfig.update({ where: { id }, data: updateData })
    return NextResponse.json({ printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint, active: printer.active } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update printer' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params
    await prisma.printerConfig.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to delete printer' }, { status: 500 })
  }
}