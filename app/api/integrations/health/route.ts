import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const healthUpdateSchema = z.object({
  provider: z.string().min(1),
  status: z.enum(['healthy', 'degraded', 'down']),
  details: z.record(z.unknown()).optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])

    const [printers, healthRecords] = await Promise.all([
      prisma.printerConfig.findMany({ orderBy: { name: 'asc' } }),
      prisma.integrationHealth.findMany({ orderBy: { provider: 'asc' } }),
    ])

    return successResponse({
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
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view integration health', 403, undefined, getPath(request))
    }
    console.error('GET /api/integrations/health error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load health', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const body = await request.json()
    const parsed = healthUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid health data', 400, parsed.error.issues, getPath(request))
    }

    const { provider, status, details } = parsed.data

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

    return successResponse({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to update health', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid health data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/integrations/health error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update health', 500, undefined, getPath(request))
  }
}