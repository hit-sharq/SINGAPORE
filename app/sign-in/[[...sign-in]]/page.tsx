'use client'

import { SignIn } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AuthShell, { clerkAppearance } from '@/components/auth-shell'

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/dashboard')
  }, [isLoaded, isSignedIn, router])

  return (
    <AuthShell
      mode="sign-in"
      eyebrow="Team access"
      title="Sign in"
      description="Use the email your club administrator added you with."
    >
      <SignIn
        path="/sign-in"
        routing="path"
        appearance={clerkAppearance}
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </AuthShell>
  )
}
