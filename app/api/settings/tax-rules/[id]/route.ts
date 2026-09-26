import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const taxSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  rate: z.number().min(0, 'Rate must be at least 0').max(100, 'Rate cannot exceed 100').optional(),
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
    const parsed = taxSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid tax rule data', 400, parsed.error.issues, getPath(request))
    }

    const { name, rate, active } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (rate !== undefined) updateData.rate = rate
    if (active !== undefined) updateData.active = active

    if (name) {
      const existing = await prisma.taxRule.findFirst({ where: { name, NOT: { id } } })
      if (existing) {
        return errorResponse(ErrorCodes.CONFLICT, 'A tax rule with this name already exists', 400, { field: 'name' }, getPath(request))
      }
    }

    const rule = await prisma.taxRule.update({ where: { id }, data: updateData })
    return successResponse({ rule: { id: rule.id, name: rule.name, rate: rule.rate.toString(), active: rule.active } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can update tax rules', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid tax rule data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/settings/tax-rules/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update tax rule', 500, undefined, getPath(request))
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN])
    const { id } = await params
    await prisma.taxRule.delete({ where: { id } })
    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can delete tax rules', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/settings/tax-rules/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete tax rule', 500, undefined, getPath(request))
  }
}