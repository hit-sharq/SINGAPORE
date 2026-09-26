import Link from 'next/link'
import { ArrowLeft, Mail, Lock } from 'lucide-react'

export default function SignUpPage() {
  return (
    <main className="auth-stage auth-stage-signup">
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
            <p className="eyebrow">By Invitation Only</p>
            <h1>Access is granted by your club.</h1>
            <p>Singapore Club workspaces are private. Administrators invite team members directly. If you&apos;ve received an invitation, check your email for the sign-up link.</p>
          </div>
          <div className="auth-dots">
            <span />
            <span />
            <span />
          </div>
        </section>
        <section className="auth-panel auth-panel-form">
          <div className="auth-copy">
            <p className="eyebrow">Invitation Required</p>
            <h2>Request Access</h2>
            <p>Contact your club manager or administrator to request an invitation.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <Mail className="size-5 text-muted-foreground shrink-0" />
              <div className="text-left">
                <p className="font-medium">Have an invitation?</p>
                <p className="text-sm text-muted-foreground">Check your email for the unique sign-up link</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <Lock className="size-5 text-muted-foreground shrink-0" />
              <div className="text-left">
                <p className="font-medium">Need access?</p>
                <p className="text-sm text-muted-foreground">Speak with your administrator to be added to the team</p>
              </div>
            </div>
            <Link
              href="/sign-in"
              className="w-full rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground text-center transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
            >
              Already have access? Sign in
            </Link>
            <Link
              href="/"
              className="w-full rounded-full border border-border px-6 py-3 font-medium text-center transition-all hover:bg-secondary hover:border-transparent"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}