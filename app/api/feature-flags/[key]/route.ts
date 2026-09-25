import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const updateSchema = z.object({
  enabled: z.boolean().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const staff = await requireRole([Role.ADMIN])
    const { key } = await params
    const body = await request.json()
    const { enabled } = updateSchema.parse(body)

    const flag = await prisma.featureFlag.findUnique({ where: { key } })
    if (!flag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: { enabled: enabled ?? flag.enabled },
    })

    await prisma.auditLog.create({
      data: { userId: staff.id, action: 'UPDATE_FEATURE_FLAG', entity: 'FeatureFlag', entityId: flag.id, metadata: { key, enabled: updated.enabled } },
    })

    return NextResponse.json({ flag: updated })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const staff = await requireRole([Role.ADMIN])
    const { key } = await params

    const flag = await prisma.featureFlag.findUnique({ where: { key } })
    if (!flag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })

    await prisma.featureFlag.delete({ where: { key } })

    await prisma.auditLog.create({
      data: { userId: staff.id, action: 'DELETE_FEATURE_FLAG', entity: 'FeatureFlag', entityId: flag.id, metadata: { key } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 })
  }
}