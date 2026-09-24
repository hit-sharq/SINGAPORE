'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Spade } from 'lucide-react'

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'details' | 'verify'>('details')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp || status === 'loading') return
    setStatus('loading')
    setError('')

    try {
      if (step === 'details') {
        const result = await signUp.create({
          firstName,
          lastName,
          emailAddress: email,
          password,
        })
        if (result.status === 'complete') {
          router.push('/')
          router.refresh()
        } else if (result.status === 'missing_requirements') {
          await signUp.prepareEmailAddressVerification()
          setStep('verify')
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code: password })
        if (result.status === 'complete') {
          router.push('/')
          router.refresh()
        } else {
          setError('Invalid verification code')
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : step === 'details' ? 'Sign up failed' : 'Verification failed'
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
          <div className="absolute -right-32 bottom-1/2 -translate-y-1/2 size-96 rounded-full bg-[#d4a85a]/5 blur-3xl" aria-hidden="true" />
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-[#f5f1e8] uppercase mb-12">
              <span className="grid size-10 place-items-center rounded-xl bg-[#d4a85a] text-base font-bold text-[#171814]">
                <Spade size={22} fill="currentColor" />
              </span>
              Singapore Club
            </Link>
          </div>
          <div className="relative z-10 max-w-xl">
            <p className="mb-5 text-xs font-medium tracking-[0.25em] text-[#d4a85a] uppercase">Your team, in sync</p>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#f5f1e8] xl:text-6xl">Make the busy nights feel simple.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#a8a399]">Join your club workspace to keep service moving, stock visible, and every handoff clear.</p>
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
                <h2 className="text-2xl font-semibold tracking-tight text-[#f5f1e8]">{step === 'details' ? 'Create your account' : 'Verify your email'}</h2>
                <p className="mt-2 text-sm text-[#a8a399]">{step === 'details' ? 'Get started with Singapore Club' : 'Enter the code sent to your email'}</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {step === 'details' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-xs font-medium uppercase tracking-[0.14em] text-[#a8a399] mb-2">
                          First name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          disabled={status === 'loading'}
                          className="w-full h-12 rounded-xl border border-white/10 bg-[#1b1c19] text-[#f5f1e8] px-4 text-sm placeholder:text-[#666860] outline-none transition-all focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/30 disabled:opacity-50"
                          placeholder="Alex"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-xs font-medium uppercase tracking-[0.14em] text-[#a8a399] mb-2">
                          Last name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          disabled={status === 'loading'}
                          className="w-full h-12 rounded-xl border border-white/10 bg-[#1b1c19] text-[#f5f1e8] px-4 text-sm placeholder:text-[#666860] outline-none transition-all focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/30 disabled:opacity-50"
                          placeholder="Kamau"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-medium uppercase tracking-[0.14em] text-[#a8a399] mb-2">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={status === 'loading'}
                        className="w-full h-12 rounded-xl border border-white/10 bg-[#1b1c19] text-[#f5f1e8] px-4 text-sm placeholder:text-[#666860] outline-none transition-all focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/30 disabled:opacity-50"
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
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
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
                      <p className="mt-1.5 text-xs text-[#77766f]">At least 8 characters</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <label htmlFor="code" className="block text-xs font-medium uppercase tracking-[0.14em] text-[#a8a399] mb-2">
                      Verification code
                    </label>
                    <input
                      id="code"
                      type="text"
                      autoComplete="one-time-code"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={6}
                      disabled={status === 'loading'}
                      className="w-full h-12 rounded-xl border border-white/10 bg-[#1b1c19] text-[#f5f1e8] px-4 text-sm placeholder:text-[#666860] outline-none transition-all focus:border-[#d4a85a] focus:ring-2 focus:ring-[#d4a85a]/30 disabled:opacity-50 text-center tracking-widest text-lg"
                      placeholder="000000"
                    />
                    <p className="mt-1.5 text-center text-xs text-[#77766f]">Check your email for the 6-digit code</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full h-12 rounded-xl bg-[#d4a85a] text-sm font-semibold text-[#171814] shadow-none hover:bg-[#e1b96d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      {step === 'details' ? 'Creating account...' : 'Verifying...'}
                    </>
                  ) : (
                    step === 'details' ? 'Create account' : 'Verify & continue'
                  )}
                </button>
              </form>

              {step === 'details' && (
                <p className="text-center text-sm text-[#a8a399]">
                  Already have access?{' '}
                  <Link href="/sign-in" className="text-[#d4a85a] hover:text-[#e1b96d] font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              )}
              {step === 'verify' && (
                <p className="text-center text-sm text-[#a8a399]">
                  Didn't receive it?{' '}
                  <button type="button" className="text-[#d4a85a] hover:text-[#e1b96d] font-medium transition-colors">
                    Resend code
                  </button>
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}