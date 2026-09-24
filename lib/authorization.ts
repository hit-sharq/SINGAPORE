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

  const adminIds = getAdminClerkIds()
  const isAdmin = adminIds.has(user.id)

  const staff = await prisma.staffProfile.upsert({
    where: { clerkUserId: user.id },
    update: {
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Staff member',
      email: user.emailAddresses[0]?.emailAddress ?? `${user.id}@clerk.local`,
      role: isAdmin ? Role.ADMIN : undefined,
    },
    create: {
      clerkUserId: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Staff member',
      email: user.emailAddresses[0]?.emailAddress ?? `${user.id}@clerk.local`,
      role: isAdmin ? Role.ADMIN : Role.CASHIER,
    },
  })

  const grants = await prisma.roleGrant.findMany({
    where: { userId: staff.id, active: true },
    select: { role: true },
  })

  return { ...staff, roles: [staff.role, ...grants.map((grant) => grant.role)] }
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
