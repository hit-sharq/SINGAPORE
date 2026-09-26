import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const discountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  percentage: z.number().min(0, 'Percentage must be at least 0').max(100, 'Percentage cannot exceed 100'),
  active: z.boolean().default(true),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const rules = await prisma.discountRule.findMany({ orderBy: { name: 'asc' } })
    return successResponse({
      rules: rules.map((r) => ({ id: r.id, name: r.name, percentage: r.percentage.toString(), active: r.active })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view discount rules', 403, undefined, getPath(request))
    }
    console.error('GET /api/settings/discount-rules error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load discount rules', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = discountSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid discount rule data', 400, parsed.error.issues, getPath(request))
    }

    const { name, percentage, active } = parsed.data

    const existing = await prisma.discountRule.findUnique({ where: { name } })
    if (existing) {
      return errorResponse(ErrorCodes.CONFLICT, 'A discount rule with this name already exists', 400, { field: 'name' }, getPath(request))
    }

    const rule = await prisma.discountRule.create({ data: { name, percentage, active: active ?? true } })
    return createdResponse({ rule: { id: rule.id, name: rule.name, percentage: rule.percentage.toString(), active: rule.active } })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can create discount rules', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid discount rule data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/settings/discount-rules error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create discount rule', 500, undefined, getPath(request))
  }
}