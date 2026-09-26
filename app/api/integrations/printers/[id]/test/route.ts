import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const printer = await prisma.printerConfig.findUnique({ where: { id } })
    if (!printer) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Printer not found', 404, undefined, getPath(request))
    }

    try {
      const res = await fetch(printer.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      const ok = res.ok
      return successResponse({
        printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint },
        online: ok,
        status: res.status,
        statusText: res.statusText,
      })
    } catch {
      return successResponse({
        printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint },
        online: false,
        error: 'Connection failed',
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to test printers', 403, undefined, getPath(request))
    }
    console.error('POST /api/integrations/printers/[id]/test error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to test printer', 500, undefined, getPath(request))
  }
}