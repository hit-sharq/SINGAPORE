import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const printerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  endpoint: z.string().url('Invalid URL format'),
  active: z.boolean().default(true),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const printers = await prisma.printerConfig.findMany({ orderBy: { name: 'asc' } })
    return successResponse({
      printers: printers.map((p) => ({ id: p.id, name: p.name, endpoint: p.endpoint, active: p.active })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view printers', 403, undefined, getPath(request))
    }
    console.error('GET /api/settings/printers error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load printers', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = printerSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid printer data', 400, parsed.error.issues, getPath(request))
    }

    const { name, endpoint, active } = parsed.data

    const printer = await prisma.printerConfig.create({ data: { name, endpoint, active: active ?? true } })
    return createdResponse({ printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint, active: printer.active } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can create printers', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid printer data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/settings/printers error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create printer', 500, undefined, getPath(request))
  }
}