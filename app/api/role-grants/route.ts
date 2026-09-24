import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const grantSchema = z.object({
  userId: z.string().cuid(),
  role: z.nativeEnum(Role),
})

export async function GET() {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const grants = await prisma.roleGrant.findMany({
      where: { active: true },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      grants: grants.map((g) => ({
        id: g.id,
        userId: g.userId,
        role: g.role,
        user: g.user,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load role grants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole([Role.ADMIN])
    const body = await request.json()
    const { userId, role } = grantSchema.parse(body)

    const existing = await prisma.roleGrant.findFirst({
      where: { userId, role, active: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Role grant already exists' }, { status: 400 })
    }

    const grant = await prisma.roleGrant.create({
      data: { userId, role, grantedBy: admin.id, active: true },
    })

    return NextResponse.json({ grant }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create role grant' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireRole([Role.ADMIN])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Grant ID required' }, { status: 400 })

    await prisma.roleGrant.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to revoke role grant' }, { status: 500 })
  }
}