import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const venueSchema = z.object({
  venueName: z.string().min(1),
})

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const [config, taxRules, discountRules, printers] = await Promise.all([
      prisma.appConfig.findFirst(),
      prisma.taxRule.findMany({ orderBy: { name: 'asc' } }),
      prisma.discountRule.findMany({ orderBy: { name: 'asc' } }),
      prisma.printerConfig.findMany({ orderBy: { name: 'asc' } }),
    ])

    return NextResponse.json({
      config: config ? { venueName: config.venueName } : { venueName: 'Singapore Club' },
      taxRules: taxRules.map((t) => ({ id: t.id, name: t.name, rate: t.rate.toString(), active: t.active })),
      discountRules: discountRules.map((d) => ({ id: d.id, name: d.name, percentage: d.percentage.toString(), active: d.active })),
      printers: printers.map((p) => ({ id: p.id, name: p.name, endpoint: p.endpoint, active: p.active })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const { venueName } = venueSchema.parse(body)

    const config = await prisma.appConfig.upsert({
      where: { initialAdminId: 'singapore-club' },
      update: { venueName },
      create: { initialAdminId: 'singapore-club', venueName },
    })

    return NextResponse.json({ config: { venueName: config.venueName } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to save venue config' }, { status: 500 })
  }
}