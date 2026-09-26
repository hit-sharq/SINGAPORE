import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const printerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  endpoint: z.string().url('Invalid URL format').optional(),
  active: z.boolean().optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params
    const body = await request.json()
    const parsed = printerSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid printer data', 400, parsed.error.issues, getPath(request))
    }

    const { name, endpoint, active } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (endpoint !== undefined) updateData.endpoint = endpoint
    if (active !== undefined) updateData.active = active

    const printer = await prisma.printerConfig.update({ where: { id }, data: updateData })
    return successResponse({ printer: { id: printer.id, name: printer.name, endpoint: printer.endpoint, active: printer.active } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can update printers', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid printer data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/settings/printers/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update printer', 500, undefined, getPath(request))
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params
    await prisma.printerConfig.delete({ where: { id } })
    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can delete printers', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/settings/printers/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete printer', 500, undefined, getPath(request))
  }
}