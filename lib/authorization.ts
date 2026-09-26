import { currentUser } from '@clerk/nextjs/server'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

function getAdminClerkIds(): Set<string> {
  const ids = process.env.ADMIN_CLERK_IDS?.split(',').map((id) => id.trim()).filter(Boolean) ?? []
  return new Set(ids)
}

const getCachedStaff = unstable_cache(
  async (clerkUserId: string, email: string) => {
    const staff = await prisma.staffProfile.findUnique({
      where: { email },
    })
    if (!staff) return null

    const adminIds = getAdminClerkIds()
    const isAdmin = adminIds.has(clerkUserId)

    const grants = await prisma.roleGrant.findMany({
      where: { userId: staff.id, active: true },
      select: { role: true },
    })

    const roles = [staff.role, ...grants.map((grant) => grant.role)]
    if (isAdmin && !roles.includes(Role.ADMIN)) {
      roles.push(Role.ADMIN)
    }

    return { ...staff, roles }
  },
  ['staff-profile'],
  { revalidate: 60, tags: ['staff'] }
)

export async function getCurrentStaff() {
  const user = await currentUser()
  if (!user) return null

  const email = user.emailAddresses[0]?.emailAddress
  if (!email) return null

  const staff = await getCachedStaff(user.id, email)
  if (!staff) return null

  // Link clerk ID if pending (non-cached update)
  if (staff.clerkUserId.startsWith('pending_')) {
    await prisma.staffProfile.update({
      where: { id: staff.id },
      data: { clerkUserId: user.id },
    })
    staff.clerkUserId = user.id
  }

  return staff
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