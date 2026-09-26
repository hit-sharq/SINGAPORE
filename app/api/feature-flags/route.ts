import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const featureFlagSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Key must start with letter and contain only alphanumeric/underscore'),
  enabled: z.boolean().default(false),
})

const updateSchema = z.object({
  enabled: z.boolean().optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } })
    return successResponse({ flags })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can view feature flags', 403, undefined, getPath(request))
    }
    console.error('GET /api/feature-flags error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load feature flags', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = featureFlagSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid feature flag data', 400, parsed.error.issues, getPath(request))
    }

    const { key, enabled } = parsed.data

    const existing = await prisma.featureFlag.findUnique({ where: { key } })
    if (existing) {
      return errorResponse(ErrorCodes.CONFLICT, 'A feature flag with this key already exists', 400, { field: 'key' }, getPath(request))
    }

    const flag = await prisma.featureFlag.create({ data: { key, enabled: enabled ?? false } })
    await prisma.auditLog.create({
      data: { userId: admin.id, action: 'CREATE_FEATURE_FLAG', entity: 'FeatureFlag', entityId: flag.id, metadata: { key, enabled } },
    })

    return createdResponse({ flag })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can create feature flags', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid feature flag data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/feature-flags error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create feature flag', 500, undefined, getPath(request))
  }
}