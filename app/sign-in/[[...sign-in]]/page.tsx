'use client'

import { useState, type FormEvent } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, Spade } from 'lucide-react'
import AuthShell from '@/components/auth-shell'

type AuthStatus = 'idle' | 'loading' | 'error'

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!signIn || status === 'loading') return

    setStatus('loading')
    setError('')

    try {
      const result = await signIn.create({ identifier, password })
      if (result.status === 'complete') {
        router.push('/')
        router.refresh()
        return
      }

      setError('We could not sign you in with those details. Check your credentials and try again.')
      setStatus('error')
    } catch (submissionError: unknown) {
      const message = submissionError instanceof Error ? submissionError.message : 'Sign in failed'
      setError(message)
      setStatus('error')
    }
  }

  const handleSocialSignIn = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!signIn || status === 'loading') return

    setStatus('loading')
    setError('')

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sign-in/callback',
        redirectUrlComplete: '/',
      })
    } catch (socialError: unknown) {
      const message = socialError instanceof Error ? socialError.message : 'Social sign in is unavailable'
      setError(message)
      setStatus('error')
    }
  }

  if (!isLoaded) {
    return (
      <main className="auth-bg flex min-h-dvh items-center justify-center text-[#d8b76e]">
        <Loader2 className="size-7 animate-spin" aria-label="Loading sign in" />
      </main>
    )
  }

  return (
    <AuthShell
      mode="sign-in"
      eyebrow="Welcome back"
      title="Sign in to your club."
      description="Pick up where your team left off."
    >
      <div className="space-y-5">
        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="auth-label" htmlFor="identifier">Email or username</label>
            <div className="relative">
              <Mail className="auth-field-icon" size={17} aria-hidden="true" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
                disabled={status === 'loading'}
                className="auth-input auth-input-with-icon"
                placeholder="you@club.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="auth-label mb-0" htmlFor="password">Password</label>
              <button
                type="button"
                onClick={() => setError('Please contact your club administrator to reset your password.')}
                className="auth-link mb-0"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <LockKeyhole className="auth-field-icon" size={17} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={status === 'loading'}
                className="auth-input auth-input-with-icon auth-input-with-action"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="auth-input-action"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={status === 'loading'} className="auth-submit">
            {status === 'loading' ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-separator" aria-hidden="true"><span>or continue with</span></div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={() => handleSocialSignIn('oauth_google')}
            className="auth-social-button"
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={() => handleSocialSignIn('oauth_apple')}
            className="auth-social-button"
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M17.05 12.54c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.61-1.7-3.17-1.72-1.35-.14-2.64.79-3.32.79-.68 0-1.73-.77-2.85-.75-1.46.02-2.81.85-3.56 2.16-1.52 2.64-.39 6.55 1.09 8.69.72 1.05 1.58 2.23 2.71 2.19 1.09-.04 1.5-.7 2.82-.7 1.31 0 1.68.7 2.83.68 1.17-.02 1.91-1.07 2.63-2.12.83-1.21 1.17-2.39 1.19-2.45-.03-.01-2.27-.87-2.29-3.46zM14.86 5.6c.6-.73 1.01-1.75.9-2.77-.87.04-1.92.58-2.55 1.31-.56.65-1.05 1.7-.92 2.7.97.07 1.96-.5 2.57-1.24z" />
            </svg>
            Apple
          </button>
        </div>

        <p className="auth-switch-copy">
          Need access? <Link href="/sign-up" className="auth-link">Request an invite <span aria-hidden="true">→</span></Link>
        </p>
      </div>
    </AuthShell>
  )
}
