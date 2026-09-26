import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { createClerkClient } from '@clerk/nextjs/server'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(Role),
})

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function GET() {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const staffList = await prisma.staffProfile.findMany({
      include: {
        grants: { where: { active: true }, select: { role: true } },
        shifts: { where: { status: 'OPEN' }, take: 1 },
        _count: { select: { shifts: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
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
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load staff' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole([Role.ADMIN])
    const body = await request.json()
    const { email, name, role } = inviteSchema.parse(body)

    const existing = await prisma.staffProfile.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Staff with this email already exists' }, { status: 400 })
    }

    // Create staff profile with INVITED status
    const newStaff = await prisma.staffProfile.create({
      data: {
        clerkUserId: `pending_${Date.now()}`,
        email,
        name,
        role,
        status: 'INVITED',
      },
    })

    // Send Clerk invitation email
    try {
      await clerkClient.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: {
          staffId: newStaff.id,
          role: role,
        },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up`,
      })
    } catch (clerkError) {
      console.error('Clerk invitation failed:', clerkError)
      // Don't fail the request - staff record created, admin can resend
    }

    return NextResponse.json({ staff: newStaff }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to invite staff' }, { status: 500 })
  }
}