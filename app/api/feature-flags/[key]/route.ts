import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const updateSchema = z.object({
  enabled: z.boolean().optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const staff = await requireRole([Role.ADMIN])
    const { key } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid feature flag data', 400, parsed.error.issues, getPath(request))
    }

    const { enabled } = parsed.data

    const flag = await prisma.featureFlag.findUnique({ where: { key } })
    if (!flag) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Feature flag not found', 404, undefined, getPath(request))
    }

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: { enabled: enabled ?? flag.enabled },
    })

    await prisma.auditLog.create({
      data: { userId: staff.id, action: 'UPDATE_FEATURE_FLAG', entity: 'FeatureFlag', entityId: flag.id, metadata: { key, enabled: updated.enabled } },
    })

    return successResponse({ flag: updated })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can update feature flags', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid feature flag data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/feature-flags/[key] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update feature flag', 500, undefined, getPath(request))
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const staff = await requireRole([Role.ADMIN])
    const { key } = await params

    const flag = await prisma.featureFlag.findUnique({ where: { key } })
    if (!flag) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Feature flag not found', 404, undefined, getPath(request))
    }

    await prisma.featureFlag.delete({ where: { key } })

    await prisma.auditLog.create({
      data: { userId: staff.id, action: 'DELETE_FEATURE_FLAG', entity: 'FeatureFlag', entityId: flag.id, metadata: { key } },
    })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can delete feature flags', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/feature-flags/[key] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete feature flag', 500, undefined, getPath(request))
  }
}