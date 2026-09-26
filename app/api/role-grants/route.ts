import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const grantSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  role: z.nativeEnum(Role),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const grants = await prisma.roleGrant.findMany({
      where: { active: true },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({
      grants: grants.map((g) => ({
        id: g.id,
        userId: g.userId,
        role: g.role,
        user: g.user,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view role grants', 403, undefined, getPath(request))
    }
    console.error('GET /api/role-grants error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load role grants', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = grantSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid grant data', 400, parsed.error.issues, getPath(request))
    }

    const { userId, role } = parsed.data

    const existing = await prisma.roleGrant.findFirst({
      where: { userId, role, active: true },
    })
    if (existing) {
      return errorResponse(ErrorCodes.CONFLICT, 'This role grant already exists', 400, { field: 'role' }, getPath(request))
    }

    const grant = await prisma.roleGrant.create({
      data: { userId, role, approvedById: admin.id, active: true },
    })

    return createdResponse({ grant })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can grant roles', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid grant data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/role-grants error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create role grant', 500, undefined, getPath(request))
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Grant ID is required', 400, undefined, getPath(request))
    }

    await prisma.roleGrant.update({ where: { id }, data: { active: false } })
    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can revoke role grants', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/role-grants error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to revoke role grant', 500, undefined, getPath(request))
  }
}