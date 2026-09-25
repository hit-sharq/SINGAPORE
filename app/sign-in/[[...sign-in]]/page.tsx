'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Spade } from 'lucide-react'

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || status === 'loading') return
    setStatus('loading')
    setError('')

    try {
      const result = await signIn.create({
        identifier,
        password,
      })
      if (result.status === 'complete') {
        router.push('/')
        router.refresh()
      } else {
        setError('Invalid credentials')
        setStatus('error')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message)
      setStatus('error')
    }
  }

  if (!isLoaded) {
    return (
      <main className="min-h-dvh bg-[#111210] flex items-center justify-center">
        <Loader2 className="size-8 text-[#d4a85a] animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[#111210] text-[#f5f1e8]">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.85fr)]">
        <section className="relative hidden overflow-hidden border-r border-white/[0.06] bg-[#171814] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 size-96 rounded-full bg-[#d4a85a]/5 blur-3xl" aria-hidden="true" />
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-[#f5f1e8] uppercase mb-12">
              <span className="grid size-10 place-items-center rounded-xl bg-[#d4a85a] text-base font-bold text-[#171814]">
                <Spade size={22} fill="currentColor" />
              </span>
              Singapore Club
            </Link>
          </div>
          <div className="relative z-10 max-w-xl">
            <p className="mb-5 text-xs font-medium tracking-[0.25em] text-[#d4a85a] uppercase">Operations, elevated</p>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#f5f1e8] xl:text-6xl">A better rhythm for every shift.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#a8a399]">One calm workspace for your floor, your team, and the numbers behind every great night.</p>
          </div>
          <div className="relative z-10 mt-12 flex items-center gap-3 text-xs text-[#77766f]">
            <div className="h-px w-24 bg-white/10" />
            <span>Singapore Club Operations · Private workspace</span>
          </div>
        </section>

        <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-[#f5f1e8] uppercase">
                <span className="grid size-10 place-items-center rounded-xl bg-[#d4a85a] text-base font-bold text-[#171814]">
                  <Spade size={22} fill="currentColor" />
                </span>
                Singapore Club
              </Link>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-[#f5f1e8]">Welcome back</h2>
                <p className="mt-2 text-sm text-[#a8a399]">Sign in to your workspace</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="identifier" className="block text-xs font-medium uppercase tracking-[0.14em] text-[#a8a399] mb-2">
                    Email or username
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={status === 'loading'}
                    className="w-full h-12 rounded-xl border border-white/10 bg-[#1b1c19] text-[#f5f1e8] px-4 text-sm placeholder:text-[#666860] outline-none transition-all focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="you@club.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium uppercase tracking-[0.14em] text-[#a8a399] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={status === 'loading'}
                      className="w-full h-12 rounded-xl border border-white/10 bg-[#1b1c19] text-[#f5f1e8] px-4 text-sm placeholder:text-[#666860] outline-none transition-all focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/30 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#77766f] hover:text-[#f5f1e8] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full h-12 rounded-xl bg-[#d4a85a] text-sm font-semibold text-[#171814] shadow-none hover:bg-[#e1b96d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.14em]">
                  <span className="bg-[#111210] px-4 text-[#77766f]">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={status === 'loading'}
                  onClick={() => (signIn as any)?.authenticateWithSocialStrategy?.({ strategy: 'oauth_google' })}
                  className="h-12 rounded-xl border border-white/10 bg-white/[0.03] text-[#f5f1e8] text-sm font-medium hover:bg-white/[0.06] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
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
                  onClick={() => (signIn as any)?.authenticateWithSocialStrategy?.({ strategy: 'oauth_apple' })}
                  className="h-12 rounded-xl border border-white/10 bg-white/[0.03] text-[#f5f1e8] text-sm font-medium hover:bg-white/[0.06] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Apple
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  disabled={status === 'loading'}
                  onClick={() => setStatus('error')}
                  className="text-xs text-[#a8a399] hover:text-[#d4a85a] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <p className="text-center text-sm text-[#a8a399]">
                Need access?{' '}
                <Link href="/sign-up" className="text-[#d4a85a] hover:text-[#e1b96d] font-medium transition-colors">
                  Request an invite
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}