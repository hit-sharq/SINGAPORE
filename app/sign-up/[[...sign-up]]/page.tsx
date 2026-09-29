'use client'

import { SignUp } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AuthShell, { clerkAppearance } from '@/components/auth-shell'

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/dashboard')
  }, [isLoaded, isSignedIn, router])

  return (
    <AuthShell
      mode="sign-up"
      eyebrow="By invitation"
      title="Create your account"
      description="Register with the exact email your administrator invited, then wait for approval to open the workspace."
    >
      <SignUp
        path="/sign-up"
        routing="path"
        appearance={clerkAppearance}
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        signInUrl="/sign-in"
      />
    </AuthShell>
  )
}
