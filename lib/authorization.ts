import { currentUser } from '@clerk/nextjs/server'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function getAdminClerkIds(): Set<string> {
  const ids = process.env.ADMIN_CLERK_IDS?.split(',').map((id) => id.trim()).filter(Boolean) ?? []
  return new Set(ids)
}

export async function getCurrentStaff() {
  const user = await currentUser()
  if (!user) return null

  const email = user.emailAddresses[0]?.emailAddress
  if (!email) return null

  // Only find existing profile linked via invite email, don't auto-create
  const staff = await prisma.staffProfile.findUnique({
    where: { email },
  })
  if (!staff) return null

  // Admin check via env var
  const adminIds = getAdminClerkIds()
  const isAdmin = adminIds.has(user.id)

  // Link clerk ID if pending
  if (staff.clerkUserId.startsWith('pending_')) {
    await prisma.staffProfile.update({
      where: { id: staff.id },
      data: { clerkUserId: user.id },
    })
    staff.clerkUserId = user.id
  }

  const grants = await prisma.roleGrant.findMany({
    where: { userId: staff.id, active: true },
    select: { role: true },
  })

  const roles = [staff.role, ...grants.map((grant) => grant.role)]
  if (isAdmin && !roles.includes(Role.ADMIN)) {
    roles.push(Role.ADMIN)
  }

  return { ...staff, roles }
}

export async function requireRole(roles: Role[]) {
  const staff = await getCurrentStaff()
  if (!staff || !staff.roles.some((role) => roles.includes(role))) {
    throw new Error('FORBIDDEN')
  }
  return staff
}

export async function ensureStaffProfile() {
  return getCurrentStaff()
}