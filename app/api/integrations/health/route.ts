import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])

    const [printers, healthRecords] = await Promise.all([
      prisma.printerConfig.findMany({ orderBy: { name: 'asc' } }),
      prisma.integrationHealth.findMany({ orderBy: { provider: 'asc' } }),
    ])

    return NextResponse.json({
      health: healthRecords.map((h) => ({
        provider: h.provider,
        status: h.status,
        checkedAt: h.checkedAt.toISOString(),
        details: h.details,
      })),
      printers: printers.map((p) => ({
        id: p.id,
        name: p.name,
        endpoint: p.endpoint,
        active: p.active,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load health' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const body = await request.json()
    const { provider, status, details } = body

    const record = await prisma.integrationHealth.upsert({
      where: { provider },
      update: { status, details, checkedAt: new Date() },
      create: { provider, status, details },
    })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'UPDATE_INTEGRATION_HEALTH',
        entity: 'IntegrationHealth',
        entityId: record.id,
        metadata: { provider, status },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to update health' }, { status: 500 })
  }
}
