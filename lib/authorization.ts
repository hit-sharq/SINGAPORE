import { currentUser } from '@clerk/nextjs/server'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function getCurrentStaff() {
  const user = await currentUser()
  if (!user) return null

  const staff = await prisma.staffProfile.findUnique({
    where: { clerkUserId: user.id },
    include: { grants: { where: { active: true }, select: { role: true } } },
  })

  if (!staff || !staff.active) return null
  return { ...staff, roles: [staff.role, ...staff.grants.map((grant) => grant.role)] }
}

export async function requireRole(roles: Role[]) {
  const staff = await getCurrentStaff()
  if (!staff || !staff.roles.some((role) => roles.includes(role))) {
    throw new Error('FORBIDDEN')
  }
  return staff
}

export async function ensureStaffProfile() {
  const user = await currentUser()
  if (!user) return null
  return prisma.staffProfile.upsert({
    where: { clerkUserId: user.id },
    update: {
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Staff member',
      email: user.emailAddresses[0]?.emailAddress ?? `${user.id}@clerk.local`,
    },
    create: {
      clerkUserId: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Staff member',
      email: user.emailAddresses[0]?.emailAddress ?? `${user.id}@clerk.local`,
    },
  })
}
