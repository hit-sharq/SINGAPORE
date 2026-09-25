'use client'

import { useState, useEffect } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const { signUp, isLoaded } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (isLoaded && signUp.status === 'complete') {
      router.push(redirectUrl)
      router.refresh()
    }
  }, [isLoaded, signUp, router, redirectUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCode(value)
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (generalError) setGeneralError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setGeneralError('')

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === 'complete') {
        setSuccess(true)
        setTimeout(() => {
          router.push(redirectUrl)
          router.refresh()
        }, 1500)
      } else {
        setErrors({ code: 'Invalid or expired code. Please try again.' })
      }
    } catch (err: any) {
      const clerkErrors = err.errors || []
      if (clerkErrors.length > 0) {
        clerkErrors.forEach((e: any) => {
          if (e.meta?.paramName) setErrors(prev => ({ ...prev, [e.meta.paramName]: e.longMessage }))
          else setGeneralError(e.longMessage)
        })
      } else {
        setGeneralError(err.message || 'Verification failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setGeneralError('')
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <main className="auth-stage auth-stage-signup">
        <div className="auth-layout">
          <section className="auth-panel auth-panel-form">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 text-primary animate-spin" />
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="auth-stage auth-stage-signup">
        <Link href="/" className="auth-brand">
          <span><Sparkles className="size-4" /></span> Singapore Club
        </Link>
        <div className="auth-layout">
          <section className="auth-panel auth-panel-copy">
            <div className="auth-message">
              <p className="eyebrow">Verified</p>
              <h1>Welcome to the club.</h1>
              <p>Your email has been verified. Redirecting to your dashboard...</p>
            </div>
            <div className="auth-dots"><span /><span /><span /></div>
          </section>
          <section className="auth-panel auth-panel-form">
            <div className="auth-copy">
              <p className="eyebrow">Your workspace</p>
              <h2>Email verified</h2>
              <p>Taking you to the dashboard...</p>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary">
              <CheckCircle className="size-8" />
              <Loader2 className="size-8 animate-spin" />
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-stage auth-stage-signup">
      <Link href="/" className="auth-brand">
        <span><Sparkles className="size-4" /></span> Singapore Club
      </Link>
      <div className="auth-layout">
        <section className="auth-panel auth-panel-copy">
          <Link href="/" className="auth-back lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur">
            <ArrowLeft className="size-4 mr-1" /> Back to home
          </Link>
          <div className="auth-message">
            <p className="eyebrow">Verify your email</p>
            <h1>Check your inbox.</h1>
            <p>We&apos;ve sent a 6-digit code to <strong className="text-foreground">{signUp.emailAddress}</strong>. Enter it below to complete your registration.</p>
          </div>
          <div className="auth-dots"><span /><span /><span /></div>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-copy">
            <p className="eyebrow">Your workspace</p>
            <h2>Verify email</h2>
            <p>Enter the code sent to your email.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} />
                {generalError}
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-xs font-medium text-muted-foreground mb-1.5">Verification code</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="code"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={handleChange}
                  maxLength={6}
                  className={`w-full h-11 rounded-lg border bg-background/50 px-10 py-2.5 text-center text-2xl letter-spacing-[0.5em] text-foreground placeholder:text-muted-foreground/50 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.code ? 'border-red-500/50' : 'border-border'}`}
                  placeholder="000000"
                  disabled={isSubmitting}
                />
              </div>
              {errors.code && <p className="mt-1.5 text-xs text-red-400">{errors.code}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify email'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend code'}
            </button>
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/sign-up" className="text-primary font-medium hover:underline">← Back to sign up</Link>
          </p>
        </section>
      </div>
    </main>
  )
}