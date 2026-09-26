import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const venueSchema = z.object({
  venueName: z.string().min(1, 'Venue name is required'),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const [config, taxRules, discountRules, printers] = await Promise.all([
      prisma.appConfig.findFirst(),
      prisma.taxRule.findMany({ orderBy: { name: 'asc' } }),
      prisma.discountRule.findMany({ orderBy: { name: 'asc' } }),
      prisma.printerConfig.findMany({ orderBy: { name: 'asc' } }),
    ])

    return successResponse({
      config: config ? { venueName: config.venueName } : { venueName: 'Singapore Club' },
      taxRules: taxRules.map((t) => ({ id: t.id, name: t.name, rate: t.rate.toString(), active: t.active })),
      discountRules: discountRules.map((d) => ({ id: d.id, name: d.name, percentage: d.percentage.toString(), active: d.active })),
      printers: printers.map((p) => ({ id: p.id, name: p.name, endpoint: p.endpoint, active: p.active })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view settings', 403, undefined, getPath(request))
    }
    console.error('GET /api/settings error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load settings', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = venueSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid venue data', 400, parsed.error.issues, getPath(request))
    }

    const { venueName } = parsed.data

    const config = await prisma.appConfig.upsert({
      where: { initialAdminId: 'singapore-club' },
      update: { venueName },
      create: { initialAdminId: 'singapore-club', venueName },
    })

    return successResponse({ config: { venueName: config.venueName } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can update settings', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid venue data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/settings error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to save venue config', 500, undefined, getPath(request))
  }
}