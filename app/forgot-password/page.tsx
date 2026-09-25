'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isLoaded) {
    return (
      <main className="auth-stage auth-stage-signin">
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
      <main className="auth-stage auth-stage-signin">
        <Link href="/" className="auth-brand">
          <span><Sparkles className="size-4" /></span> Singapore Club
        </Link>
        <div className="auth-layout">
          <section className="auth-panel auth-panel-copy">
            <Link href="/" className="auth-back lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur">
              <ArrowLeft className="size-4 mr-1" /> Back to home
            </Link>
            <div className="auth-message">
              <p className="eyebrow">Check your email</p>
              <h1>Reset link sent.</h1>
              <p>We&apos;ve sent a password reset link to <strong className="text-foreground">{email}</strong>. Follow the link to create a new password.</p>
            </div>
            <div className="auth-dots"><span /><span /><span /></div>
          </section>
          <section className="auth-panel auth-panel-form">
            <div className="auth-copy">
              <p className="eyebrow">Your workspace</p>
              <h2>Email sent</h2>
              <p>Check your inbox and follow the link to reset your password.</p>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary">
              <CheckCircle className="size-8" />
              <span className="text-sm">Redirecting to sign in...</span>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setGeneralError('')

    try {
      await signIn.create({
        identifier: email,
        strategy: 'reset_password_email_code',
        redirectUrl: '/reset-password',
      })
      setSuccess(true)
    } catch (err: any) {
      const clerkErrors = err.errors || []
      if (clerkErrors.length > 0) {
        clerkErrors.forEach((e: any) => {
          if (e.meta?.paramName) setErrors(prev => ({ ...prev, [e.meta.paramName]: e.longMessage }))
          else setGeneralError(e.longMessage)
        })
      } else {
        setGeneralError(err.message || 'Failed to send reset link')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
    if (generalError) setGeneralError('')
  }

  return (
    <main className="auth-stage auth-stage-signin">
      <Link href="/" className="auth-brand">
        <span><Sparkles className="size-4" /></span> Singapore Club
      </Link>
      <div className="auth-layout">
        <section className="auth-panel auth-panel-copy">
          <Link href="/" className="auth-back lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur">
            <ArrowLeft className="size-4 mr-1" /> Back to home
          </Link>
          <div className="auth-message">
            <p className="eyebrow">Forgot password?</p>
            <h1>No worries.</h1>
            <p>Enter your email and we&apos;ll send you a link to reset your password.</p>
          </div>
          <div className="auth-dots"><span /><span /><span /></div>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-copy">
            <p className="eyebrow">Your workspace</p>
            <h2>Reset password</h2>
            <p>Enter your email to receive a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} />
                {generalError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleChange}
                  className={`w-full h-11 rounded-lg border bg-background/50 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-red-500/50' : 'border-border'}`}
                  placeholder="you@club.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/sign-in" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  )
}