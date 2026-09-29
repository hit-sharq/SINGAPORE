import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getStaffStatus } from '@/lib/authorization'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pending-approval(.*)',
  '/api/pesapal/ipn(.*)',
  '/api/pesapal/callback(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // The root path is not a landing page: send people straight to the auth
  // system, or to the workspace if they already have a session.
  if (request.nextUrl.pathname === '/') {
    const { userId } = await auth()
    return NextResponse.redirect(new URL(userId ? '/dashboard' : '/sign-in', request.url))
  }

  if (!isPublicRoute(request)) {
    const { userId } = await auth()
    
    if (!userId) {
      const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Check if user has an active staff profile (cached for 30s so this does
    // not hit the database on every single request)
    const staff = await getStaffStatus(userId)

    if (!staff || staff.status !== 'ACTIVE') {
      const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
      if (isApiRoute) {
        return NextResponse.json({ error: 'Access pending approval' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/pending-approval', request.url))
    }
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|map)).*)', '/(api|trpc)(.*)'],
}