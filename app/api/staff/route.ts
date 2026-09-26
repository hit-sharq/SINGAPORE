import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { createClerkClient } from '@clerk/nextjs/server'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(Role),
})

const resendInviteSchema = z.object({
  staffId: z.string().cuid('Invalid staff ID'),
})

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const staffList = await prisma.staffProfile.findMany({
      include: {
        grants: { where: { active: true }, select: { role: true } },
        shifts: { where: { status: 'OPEN' }, take: 1 },
        _count: { select: { shifts: true } },
      },
      orderBy: { name: 'asc' },
    })

    return createdResponse({
      staff: staffList.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        roles: [s.role, ...s.grants.map((g) => g.role)],
        status: s.status,
        lastActive: s.lastActive?.toISOString() ?? null,
        shiftCount: s._count.shifts,
        hasOpenShift: s.shifts.length > 0,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view staff', 403, undefined, getPath(request))
    }
    console.error('GET /api/staff error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load staff', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid invitation data', 400, parsed.error.issues, getPath(request))
    }

    const { email, name, role } = parsed.data

    const existing = await prisma.staffProfile.findUnique({ where: { email } })
    if (existing) {
      return errorResponse(ErrorCodes.CONFLICT, 'A staff member with this email already exists', 400, { field: 'email' }, getPath(request))
    }

    const newStaff = await prisma.staffProfile.create({
      data: {
        clerkUserId: `pending_${Date.now()}`,
        email,
        name,
        role,
        status: 'INVITED',
      },
    })

    try {
      await clerkClient.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { staffId: newStaff.id, role },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up`,
      })
    } catch (clerkError) {
      console.error('Clerk invitation failed:', clerkError)
    }

    return createdResponse({ staff: newStaff })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can invite staff', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid invitation data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/staff error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to invite staff', 500, undefined, getPath(request))
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('id')
    if (!staffId) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Staff ID is required', 400, undefined, getPath(request))
    }

    const staff = await prisma.staffProfile.findUnique({ where: { id: staffId } })
    if (!staff) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Staff member not found', 404, undefined, getPath(request))
    }

    if (staff.status === 'ACTIVE') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot revoke an active staff member. Deactivate them first.', 400, { field: 'status' }, getPath(request))
    }

    await prisma.staffProfile.delete({ where: { id: staffId } })

    return successResponse({ success: true, message: 'Invitation revoked' })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can revoke invitations', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/staff error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to revoke invitation', 500, undefined, getPath(request))
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = resendInviteSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid request data', 400, parsed.error.issues, getPath(request))
    }

    const { staffId } = parsed.data

    const staff = await prisma.staffProfile.findUnique({ where: { id: staffId } })
    if (!staff) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Staff member not found', 404, undefined, getPath(request))
    }

    if (staff.status === 'ACTIVE') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot resend invitation for active staff member', 400, { field: 'status' }, getPath(request))
    }

    try {
      await clerkClient.invitations.createInvitation({
        emailAddress: staff.email,
        publicMetadata: { staffId: staff.id, role: staff.role },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up`,
      })
    } catch (clerkError) {
      console.error('Clerk invitation failed:', clerkError)
      return errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, 'Failed to send invitation email', 502, undefined, getPath(request))
    }

    return successResponse({ success: true, message: 'Invitation resent' })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can resend invitations', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid request data', 400, error.issues, getPath(request))
    }
    console.error('PUT /api/staff error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to resend invitation', 500, undefined, getPath(request))
  }
}