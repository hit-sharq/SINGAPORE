import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { Role } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const staff = await requireRole(Object.values(Role))
    return successResponse({
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        roles: staff.roles,
        status: staff.status,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view your profile', 403, undefined, request.nextUrl.pathname)
    }
    console.error('GET /api/me error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load profile', 500, undefined, request.nextUrl.pathname)
  }
}
