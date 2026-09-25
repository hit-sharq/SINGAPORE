import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const printer = await prisma.printerConfig.findUnique({ where: { id } })
    if (!printer) return NextResponse.json({ error: 'Printer not found' }, { status: 404 })

    try {
      const res = await fetch(printer.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      const ok = res.ok
      return NextResponse.json({
        printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint },
        online: ok,
        status: res.status,
        statusText: res.statusText,
      })
    } catch (e) {
      return NextResponse.json({
        printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint },
        online: false,
        error: 'Connection failed',
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to test printer' }, { status: 500 })
  }
}
