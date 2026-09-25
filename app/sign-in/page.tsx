'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Github, Chrome } from 'lucide-react'

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

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

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
        redirectUrl,
      })

      if (result.status === 'complete') {
        router.push(redirectUrl)
        router.refresh()
      } else {
        setGeneralError('Authentication failed. Please try again.')
      }
    } catch (err: any) {
      const clerkErrors = err.errors || []
      if (clerkErrors.length > 0) {
        clerkErrors.forEach((e: any) => {
          if (e.meta?.paramName) setErrors(prev => ({ ...prev, [e.meta.paramName]: e.longMessage }))
          else setGeneralError(e.longMessage)
        })
      } else {
        setGeneralError(err.message || 'Something went wrong')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOAuth = async (strategy: 'oauth_google' | 'oauth_github') => {
    try {
      await signIn.authenticateWithRedirect({ strategy, redirectUrl })
    } catch (err: any) {
      setGeneralError(err.message || 'OAuth failed')
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
            <p className="eyebrow">Welcome back</p>
            <h1>Keep the whole club moving.</h1>
            <p>Sign in to see your operation clearly, pick up the next task, and lead the shift with confidence.</p>
          </div>
          <div className="auth-dots"><span /><span /><span /></div>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-copy">
            <p className="eyebrow">Your workspace</p>
            <h2>Sign in</h2>
            <p>Return to the Singapore Club dashboard.</p>
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
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full h-11 rounded-lg border bg-background/50 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-red-500/50' : 'border-border'}`}
                  placeholder="you@club.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-muted-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative flex items-center px-4 text-xs text-muted-foreground bg-background/80">Or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth('oauth_google')}
              disabled={isSubmitting}
              className="h-11 rounded-lg border border-border bg-background/50 flex items-center justify-center gap-2 text-sm font-medium text-foreground transition hover:bg-background hover:border-primary/50 disabled:opacity-50"
            >
              <Chrome className="size-5" />
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('oauth_github')}
              disabled={isSubmitting}
              className="h-11 rounded-lg border border-border bg-background/50 flex items-center justify-center gap-2 text-sm font-medium text-foreground transition hover:bg-background hover:border-primary/50 disabled:opacity-50"
            >
              <Github className="size-5" />
              GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </section>
      </div>
    </main>
  )
}