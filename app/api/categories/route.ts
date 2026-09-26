import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(Object.values(Role))
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })

    return successResponse({ categories })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view categories', 403, undefined, getPath(request))
    }
    console.error('GET /api/categories error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load categories', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const body = await request.json()
    const parsed = categorySchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid category data', 400, parsed.error.issues, getPath(request))
    }

    const { name } = parsed.data

    const existing = await prisma.category.findUnique({ where: { name } })
    if (existing) {
      return errorResponse(ErrorCodes.CONFLICT, 'A category with this name already exists', 400, { field: 'name' }, getPath(request))
    }

    const category = await prisma.category.create({ data: { name } })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'CREATE_CATEGORY',
        entity: 'Category',
        entityId: category.id,
        metadata: { name },
      },
    })

    return createdResponse({ category })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to create categories', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid category data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/categories error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create category', 500, undefined, getPath(request))
  }
}