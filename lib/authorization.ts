import { auth, currentUser } from '@clerk/nextjs/server'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

function getAdminClerkIds(): Set<string> {
  const ids = process.env.ADMIN_CLERK_IDS?.split(',').map((id) => id.trim()).filter(Boolean) ?? []
  return new Set(ids)
}

function withRoles(staff: { id: string; role: Role; clerkUserId: string; grants: { role: Role }[] }) {
  const roles = [staff.role, ...staff.grants.map((grant) => grant.role)]
  if (getAdminClerkIds().has(staff.clerkUserId) && !roles.includes(Role.ADMIN)) {
    roles.push(Role.ADMIN)
  }
  return roles
}

const getCachedStaff = unstable_cache(
  async (clerkUserId: string, email: string) => {
    const staff = await prisma.staffProfile.findUnique({
      where: { email },
      include: { grants: { where: { active: true }, select: { role: true } } },
    })
    if (!staff) return null

    return { ...staff, roles: withRoles(staff) }
  },
  ['staff-profile'],
  { revalidate: 60, tags: ['staff'] }
)

const getCachedStaffByClerkId = unstable_cache(
  async (clerkUserId: string) => {
    const staff = await prisma.staffProfile.findUnique({
      where: { clerkUserId },
      include: { grants: { where: { active: true }, select: { role: true } } },
    })
    if (!staff) return null

    return { ...staff, roles: withRoles(staff) }
  },
  ['staff-profile-by-clerk-id'],
  { revalidate: 30, tags: ['staff'] }
)

// The Proxy runs before the Next data cache is available, so this uses a plain
// in-memory TTL instead. It keeps one staff lookup off the database for 30s
// instead of hitting it on every single request.
const STAFF_STATUS_TTL_MS = 30_000
const staffStatusCache = new Map<string, { value: { id: string; status: string } | null; expiresAt: number }>()

export async function getStaffStatus(clerkUserId: string) {
  const hit = staffStatusCache.get(clerkUserId)
  if (hit && hit.expiresAt > Date.now()) return hit.value

  const value = await prisma.staffProfile.findUnique({
    where: { clerkUserId },
    select: { id: true, status: true },
  })
  staffStatusCache.set(clerkUserId, { value, expiresAt: Date.now() + STAFF_STATUS_TTL_MS })
  return value
}

export async function getCurrentStaff() {
  // The session token is already verified by clerkMiddleware, so this reads
  // claims from the request instead of calling Clerk's API on every request.
  const { userId } = await auth()
  if (userId) {
    const staff = await getCachedStaffByClerkId(userId)
    if (staff) return staff
  }

  // Fallback for staff profiles still holding a pending clerk id: they can only
  // be resolved by email, which requires the Clerk API.
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
  // Roles alone are not permission to act. A suspended or deactivated account
  // keeps its roles, so without this check a staff member removed by an admin
  // would keep working until their cached profile expired.
  if (!isStaffActive(staff)) {
    throw new Error('FORBIDDEN')
  }
  return staff
}

/**
 * Whether a staff profile may act. A profile counts as active only when the
 * status string says ACTIVE *and* the active flag has not been cleared —
 * both fields exist and both are set by different parts of the app.
 */
export function isStaffActive(staff: { status?: string | null; active?: boolean | null }): boolean {
  const statusOk = !staff.status || String(staff.status).toUpperCase() === 'ACTIVE'
  return statusOk && staff.active !== false
}

export async function ensureStaffProfile() {
  return getCurrentStaff()
}
