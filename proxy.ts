import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pending-approval(.*)',
  '/api/pesapal/ipn(.*)',
  '/api/pesapal/callback(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId } = await auth()
    
    if (!userId) {
      const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Check if user has an active staff profile
    const staff = await prisma.staffProfile.findUnique({
      where: { clerkUserId: userId },
    })

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