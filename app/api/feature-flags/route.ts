import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const featureFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  enabled: z.boolean().default(false),
})

const updateSchema = z.object({
  enabled: z.boolean().optional(),
})

export async function GET() {
  try {
    await requireRole([Role.ADMIN])
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } })
    return NextResponse.json({ flags })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load feature flags' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const { key, enabled } = featureFlagSchema.parse(body)

    const existing = await prisma.featureFlag.findUnique({ where: { key } })
    if (existing) return NextResponse.json({ error: 'Feature flag with this key exists' }, { status: 400 })

    const flag = await prisma.featureFlag.create({ data: { key, enabled: enabled ?? false } })
    await prisma.auditLog.create({
      data: { userId: (await requireRole([Role.ADMIN])).id, action: 'CREATE_FEATURE_FLAG', entity: 'FeatureFlag', entityId: flag.id, metadata: { key, enabled } },
    })

    return NextResponse.json({ flag }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 })
  }
}