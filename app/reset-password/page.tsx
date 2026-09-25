'use client'

import { useState, useEffect } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    if (!token) setTokenValid(false)
  }, [token])

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

  if (!tokenValid) {
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
              <p className="eyebrow">Invalid link</p>
              <h1>Reset link expired.</h1>
              <p>This password reset link is invalid or has expired. Please request a new one.</p>
            </div>
            <div className="auth-dots"><span /><span /><span /></div>
          </section>
          <section className="auth-panel auth-panel-form">
            <div className="auth-copy">
              <p className="eyebrow">Your workspace</p>
              <h2>Invalid reset link</h2>
              <p>Request a new password reset email.</p>
            </div>
            <Link href="/forgot-password" className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center transition hover:bg-primary/90">
              Request new link
            </Link>
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
              <p className="eyebrow">Password updated</p>
              <h1>All set.</h1>
              <p>Your password has been reset. Redirecting to sign in...</p>
            </div>
            <div className="auth-dots"><span /><span /><span /></div>
          </section>
          <section className="auth-panel auth-panel-form">
            <div className="auth-copy">
              <p className="eyebrow">Your workspace</p>
              <h2>Password reset complete</h2>
              <p>You can now sign in with your new password.</p>
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

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (generalError) setGeneralError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setGeneralError('')

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setErrors(prev => ({ ...prev, password: passwordError }))
      setIsSubmitting(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      setIsSubmitting(false)
      return
    }

    try {
      await signIn.resetPassword({
        password: formData.password,
        token: token!,
      })
      setSuccess(true)
      setTimeout(() => {
        router.push('/sign-in')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      const clerkErrors = err.errors || []
      if (clerkErrors.length > 0) {
        clerkErrors.forEach((e: any) => {
          if (e.meta?.paramName) setErrors(prev => ({ ...prev, [e.meta.paramName]: e.longMessage }))
          else setGeneralError(e.longMessage)
        })
      } else {
        setGeneralError(err.message || 'Failed to reset password')
      }
    } finally {
      setIsSubmitting(false)
    }
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
            <p className="eyebrow">New password</p>
            <h1>Set a new password.</h1>
            <p>Your new password must be different from previously used passwords.</p>
          </div>
          <div className="auth-dots"><span /><span /><span /></div>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-copy">
            <p className="eyebrow">Your workspace</p>
            <h2>Reset password</h2>
            <p>Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} />
                {generalError}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full h-11 rounded-lg border bg-background/50 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-red-500/50' : 'border-border'}`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full h-11 rounded-lg border bg-background/50 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.confirmPassword ? 'border-red-500/50' : 'border-border'}`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Resetting...
                </span>
              ) : (
                'Reset password'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary font-medium hover:underline">← Back to sign in</Link>
          </p>
        </section>
      </div>
    </main>
  )
}