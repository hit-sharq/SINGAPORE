'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Github, Chrome } from 'lucide-react'

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (generalError) setGeneralError('')
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
    return null
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
      const result = await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.email,
        password: formData.password,
        redirectUrl,
      })

      if (result.status === 'complete') {
        router.push(redirectUrl)
        router.refresh()
      } else if (result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        router.push(`/sign-up/verify?redirect_url=${encodeURIComponent(redirectUrl)}`)
      } else {
        setGeneralError('Registration failed. Please try again.')
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
      await signUp.authenticateWithRedirect({ strategy, redirectUrl })
    } catch (err: any) {
      setGeneralError(err.message || 'OAuth failed')
    }
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
            <p className="eyebrow">Start with clarity</p>
            <h1>Give every shift a better signal.</h1>
            <p>Create your Singapore Club workspace and bring orders, stock, tables, staff, and reporting into one calm command center.</p>
          </div>
          <div className="auth-dots"><span /><span /><span /></div>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-copy">
            <p className="eyebrow">Your workspace</p>
            <h2>Create account</h2>
            <p>Start building a more reliable operation.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} />
                {generalError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-muted-foreground mb-1.5">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full h-11 rounded-lg border bg-background/50 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.firstName ? 'border-red-500/50' : 'border-border'}`}
                    placeholder="John"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-muted-foreground mb-1.5">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full h-11 rounded-lg border bg-background/50 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.lastName ? 'border-red-500/50' : 'border-border'}`}
                    placeholder="Doe"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.lastName && <p className="mt-1.5 text-xs text-red-400">{errors.lastName}</p>}
              </div>
            </div>

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
              <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
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
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm password</label>
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
                  Creating account...
                </span>
              ) : (
                'Create account'
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
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  )
}