'use client'

import { useState, type FormEvent } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import AuthShell from '@/components/auth-shell'

type AuthStatus = 'idle' | 'loading' | 'error'
type SignUpStep = 'details' | 'verify'

export default function SignUpPage() {
  const { signUp, isLoaded } = useSignUp()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [error, setError] = useState('')
  const [step, setStep] = useState<SignUpStep>('details')

  const handleResend = async () => {
    if (!signUp || status === 'loading') return
    setStatus('loading')
    setError('')

    try {
      await signUp.prepareEmailAddressVerification()
      setStatus('idle')
    } catch (resendError: unknown) {
      const message = resendError instanceof Error ? resendError.message : 'Failed to resend code'
      setError(message)
      setStatus('error')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
          return
        }

        if (result.status === 'missing_requirements') {
          await signUp.prepareEmailAddressVerification()
          setStep('verify')
          setStatus('idle')
          return
        }

        setError('We need a little more information to finish creating your account.')
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code: verificationCode })
        if (result.status === 'complete') {
          router.push('/')
          router.refresh()
          return
        }
        setError('That verification code is not valid. Please check it and try again.')
      }

      setStatus('error')
    } catch (submissionError: unknown) {
      const message = submissionError instanceof Error ? submissionError.message : step === 'details' ? 'Sign up failed' : 'Verification failed'
      setError(message)
      setStatus('error')
    }
  }

  if (!isLoaded) {
    return (
      <main className="auth-bg flex min-h-dvh items-center justify-center text-[#d8b76e]">
        <Loader2 className="size-7 animate-spin" aria-label="Loading sign up" />
      </main>
    )
  }

  return (
    <AuthShell
      mode="sign-up"
      eyebrow="Your workspace awaits"
      title={step === 'details' ? 'Create your account.' : 'Verify your email.'}
      description={step === 'details' ? 'Join the team and keep every shift in sync.' : 'Enter the six-digit code we sent to your inbox.'}
    >
      <div className="space-y-5">
        {error && <div className="auth-error" role="alert">{error}</div>}

        {step === 'verify' && (
          <div className="auth-verify-banner">
            <Mail size={17} aria-hidden="true" />
            <span>Code sent to <strong>{email}</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {step === 'details' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="auth-label" htmlFor="firstName">First name</label>
                  <div className="relative">
                    <UserRound className="auth-field-icon" size={17} aria-hidden="true" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                      disabled={status === 'loading'}
                      className="auth-input auth-input-with-icon"
                      placeholder="Alex"
                    />
                  </div>
                </div>
                <div>
                  <label className="auth-label" htmlFor="lastName">Last name</label>
                  <div className="relative">
                    <UserRound className="auth-field-icon" size={17} aria-hidden="true" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                      disabled={status === 'loading'}
                      className="auth-input auth-input-with-icon"
                      placeholder="Kamau"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="auth-label" htmlFor="email">Work email</label>
                <div className="relative">
                  <Mail className="auth-field-icon" size={17} aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={status === 'loading'}
                    className="auth-input auth-input-with-icon"
                    placeholder="you@club.com"
                  />
                </div>
              </div>

              <div>
                <label className="auth-label" htmlFor="password">Create a password</label>
                <div className="relative">
                  <LockKeyhole className="auth-field-icon" size={17} aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={status === 'loading'}
                    className="auth-input auth-input-with-icon auth-input-with-action"
                    placeholder="At least 8 characters"
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
            </>
          ) : (
            <div>
              <label className="auth-label" htmlFor="verificationCode">Verification code</label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                disabled={status === 'loading'}
                className="auth-input auth-code-input"
                placeholder="000000"
              />
              <p className="mt-2 text-center text-xs text-white/35">We sent a six-digit code to your email.</p>
            </div>
          )}

          <button type="submit" disabled={status === 'loading'} className="auth-submit">
            {status === 'loading' ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {step === 'details' ? 'Creating account...' : 'Verifying...'}
              </>
            ) : (
              <>
                {step === 'details' ? 'Create account' : 'Verify and continue'}
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {step === 'details' ? (
          <p className="auth-switch-copy">
            Already have access? <Link href="/sign-in" className="auth-link">Sign in <span aria-hidden="true">→</span></Link>
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3 text-center text-sm text-white/45">
            <button type="button" onClick={() => { setStep('details'); setPassword(''); setVerificationCode(''); setError('') }} className="auth-link">Back to details</button>
            <span>Didn&apos;t receive it?</span>
            <button type="button" onClick={handleResend} disabled={status === 'loading'} className="auth-link">Resend code</button>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
