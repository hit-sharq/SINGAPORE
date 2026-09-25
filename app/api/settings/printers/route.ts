import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const printerSchema = z.object({
  name: z.string().min(1),
  endpoint: z.string().url(),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const printers = await prisma.printerConfig.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ printers: printers.map((p) => ({ id: p.id, name: p.name, endpoint: p.endpoint, active: p.active })) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load printers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const { name, endpoint, active } = printerSchema.parse(body)

    const printer = await prisma.printerConfig.create({ data: { name, endpoint, active: active ?? true } })
    return NextResponse.json({ printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint, active: printer.active } }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create printer' }, { status: 500 })
  }
}