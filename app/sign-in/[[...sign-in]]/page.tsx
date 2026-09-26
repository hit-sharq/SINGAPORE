import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function SignInPage() {
  return (
    <main className="auth-stage auth-stage-signin">
      <Link href="/" className="auth-brand">
        Singapore Club
      </Link>
      <div className="auth-layout">
        <section className="auth-panel auth-panel-copy">
          <Link
            href="/"
            className="auth-back lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur"
          >
            <ArrowLeft className="size-4 mr-1" /> Back to home
          </Link>
          <div className="auth-message">
            <p className="eyebrow">Welcome back</p>
            <h1>Keep the whole club moving.</h1>
            <p>Sign in to see your operation clearly, pick up the next task, and lead the shift with confidence.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6">
            <ShieldCheck className="size-4" />
            <span>Access requires an active team membership</span>
          </div>
          <div className="auth-dots">
            <span />
            <span />
            <span />
          </div>
        </section>
        <section className="auth-panel auth-panel-form">
          <div className="auth-copy">
            <p className="eyebrow">Your workspace</p>
            <h2>Sign in</h2>
            <p>Return to the Singapore Club dashboard.</p>
          </div>
          <SignIn
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'auth-clerk-card',
                headerTitle: 'text-foreground',
                headerSubtitle: 'text-muted-foreground',
                formButtonPrimary: 'bg-primary hover:bg-primary/90 w-full py-3',
                footerActionLink: 'text-foreground',
                externalAccountButton: 'w-full justify-center py-3',
                formFieldInput: 'w-full',
                dividerLine: 'max-w-full',
              },
            }}
            localization={{
              signIn: {
                formButtonPrimary: 'Sign in',
                title: 'Sign in',
                subtitle: '',
                alternativeMethods: '',
                forgotPassword: '',
                footerActionLink: 'Request access',
                footerActionText: "Don't have access?",
                socialButtonsBlockButton: 'Continue with {strategy}',
                resetPassword: {
                  formButtonPrimary: 'Reset password',
                  title: 'Reset password',
                  subtitle: '',
                },
              },
            }}
          />
        </section>
      </div>
    </main>
  )
}