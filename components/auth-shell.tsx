import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck, Sparkles, Spade } from 'lucide-react'

type AuthMode = 'sign-in' | 'sign-up'

type AuthShellProps = {
  children: ReactNode
  mode: AuthMode
  eyebrow: string
  title: string
  description: string
}

const features = [
  'Point of sale, orders and floor in one place',
  'Inventory and low stock, always current',
  'Access shaped around each role',
]

export function AuthShell({ children, mode, eyebrow, title, description }: AuthShellProps) {
  const isSignIn = mode === 'sign-in'
  const storyEyebrow = isSignIn ? 'Member access' : 'Your team, in sync'
  const storyTitle = isSignIn ? 'A better rhythm for every shift.' : 'Make busy nights feel simple.'
  const storyDescription = isSignIn
    ? 'Pick up where your team left off. One clear view for the floor, the stock and the numbers behind every great night.'
    : 'Bring your club workspace together so service keeps moving, stock stays visible and every handoff is clear.'

  return (
    <main className="auth-bg auth-shell min-h-dvh overflow-x-hidden text-[#f7f4ed]">
      <div className="auth-shell-grid mx-auto grid min-h-dvh w-full max-w-[1600px]">
        <section className="auth-story-panel relative hidden min-h-dvh overflow-hidden border-r border-white/[0.08] lg:flex lg:flex-col">
          <div className="auth-story-grid" aria-hidden="true" />
          <div className="auth-story-glow auth-story-glow-one" aria-hidden="true" />
          <div className="auth-story-glow auth-story-glow-two" aria-hidden="true" />
          <div className="auth-story-orbit auth-story-orbit-one" aria-hidden="true" />
          <div className="auth-story-orbit auth-story-orbit-two" aria-hidden="true" />
          <div className="auth-spade-watermark" aria-hidden="true">
            <Spade fill="currentColor" />
          </div>

          <div className="auth-story-inner relative z-10 flex min-h-dvh flex-col px-8 py-8 sm:px-12 sm:py-10 xl:px-16 xl:py-12">
            <Link href="/sign-in" className="auth-brand group inline-flex w-fit items-center gap-3" aria-label="Singapore Club sign in">
              <span className="auth-logo-mark">
                <Spade size={23} fill="currentColor" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-[#f7f4ed]">Singapore Club</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.24em] text-white/50">Operations, beautifully aligned</span>
              </span>
            </Link>

            <div className="auth-story-body my-auto max-w-2xl py-16">
              <p className="auth-eyebrow"><Sparkles size={14} aria-hidden="true" /> {storyEyebrow}</p>
              <h1 className="auth-story-title">{storyTitle}</h1>
              <p className="auth-story-lead mt-6 max-w-lg text-base leading-7 text-white/55 sm:text-lg">{storyDescription}</p>

              <div className="auth-command-card mt-10 max-w-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Your first shift</p>
                    <p className="mt-2 text-sm font-medium text-white/80">Three things worth doing</p>
                  </div>
                  <span className="auth-live-badge"><span className="auth-live-dot" /> Ready</span>
                </div>
                <ul className="auth-story-checklist mt-6 grid gap-3 border-t border-white/[0.08] pt-5 text-sm text-white/60">
                  <li className="flex items-center gap-3">
                    <span className="auth-feature-check"><Check size={13} strokeWidth={2.5} aria-hidden="true" /></span>
                    Open or confirm your cash shift
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="auth-feature-check"><Check size={13} strokeWidth={2.5} aria-hidden="true" /></span>
                    Scan low stock before service starts
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="auth-feature-check"><Check size={13} strokeWidth={2.5} aria-hidden="true" /></span>
                    Check the floor and pool layout
                  </li>
                </ul>
              </div>

              <ul className="auth-story-features mt-8 flex max-w-lg flex-col gap-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-white/65">
                    <span className="auth-feature-check"><Check size={13} strokeWidth={2.5} aria-hidden="true" /></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.14em] text-white/50">
              <span className="flex items-center gap-2"><ShieldCheck size={14} aria-hidden="true" /> Private workspace</span>
              <span className="hidden sm:inline">Singapore Club · Nairobi</span>
            </div>
          </div>
        </section>
        <section className="auth-form-panel relative flex min-h-dvh px-5 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] sm:px-8 sm:py-10 lg:px-12 xl:px-20">
          <div className="absolute inset-0 auth-form-panel-glow" aria-hidden="true" />
          {/* my-auto (not items-center) keeps the card fully reachable when the
              form is taller than a short phone screen. */}
          <div className="relative z-10 mx-auto my-auto flex w-full max-w-[440px] flex-col">
            <Link href="/sign-in" className="auth-brand group mb-7 inline-flex w-fit items-center gap-3 sm:mb-10 lg:hidden" aria-label="Singapore Club sign in">
              <span className="auth-logo-mark">
                <Spade size={23} fill="currentColor" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-[#f7f4ed]">Singapore Club</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.24em] text-white/50">Operations, beautifully aligned</span>
              </span>
            </Link>

            <div className="auth-form-heading">
              <p className="auth-form-eyebrow">{eyebrow}</p>
              <h2 className="auth-form-title">{title}</h2>
              <p className="auth-form-description">{description}</p>
            </div>

            <div className="auth-form-card">{children}</div>

            <p className="auth-form-footer flex items-center justify-center gap-2 text-center text-xs leading-5 text-white/55">
              <ArrowRight size={13} aria-hidden="true" />
              Access is managed by your club administrator.
            </p>

            <AuthFooter mode={mode} />
          </div>
        </section>
      </div>
    </main>
  )
}

function AuthFooter({ mode }: { mode: AuthMode }) {
  const year = new Date().getFullYear()

  return (
    <footer className="auth-marketing">
      <div className="auth-marketing-brand">
        <span className="auth-logo-mark auth-logo-mark-sm">
          <Spade size={15} fill="currentColor" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Singapore Club</p>
          <p className="auth-marketing-tagline mt-0.5 text-[11px] leading-5 text-white/40">
            One calm workspace for every shift — point of sale, floor, inventory and reports.
          </p>
        </div>
      </div>

      <nav className="auth-marketing-links" aria-label="Auth links">
        <Link href="/sign-in" className={mode === 'sign-in' ? 'is-current' : undefined}>
          Sign in
        </Link>
        <Link href="/sign-up" className={mode === 'sign-up' ? 'is-current' : undefined}>
          Create account
        </Link>
        <a href="https://www.lumyn.co.ke" target="_blank" rel="noopener noreferrer">
          lumyn.co.ke
        </a>
      </nav>

      <div className="auth-marketing-meta">
        <span>© {year} Singapore Club. All rights reserved.</span>
        <span className="hidden sm:inline">Private workspace · Nairobi</span>
        <span>
          Built by{' '}
          <a href="https://www.lumyn.co.ke" target="_blank" rel="noopener noreferrer" className="auth-credit">
            Lumyn Technologies
          </a>
        </span>
      </div>
    </footer>
  )
}

export const clerkAppearance = {
  variables: {
    colorPrimary: '#d8b76e',
    colorBackground: '#191a16',
    colorInputBackground: '#111210',
    colorInputText: '#f7f4ed',
    colorText: '#f7f4ed',
    colorTextSecondary: 'rgba(247,244,237,0.5)',
    colorNeutral: '#f7f4ed',
    borderRadius: '0.75rem',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    card: 'w-full bg-transparent shadow-none p-0',
    header: 'hidden',
    socialButtonsBlockButton: 'auth-btn-ghost h-12',
    socialButtonsBlockButtonText: 'text-sm font-medium',
    dividerLine: 'bg-white/10',
    dividerText: 'text-white/50 text-xs',
    formFieldLabel: 'text-xs font-medium text-white/65',
    footerItem: 'hidden',
    footerAction: 'mt-3 pt-0 border-t-0',
    dividerRow: 'my-1.5',
    socialButtonsBlock: 'mb-1',
    formFieldRow: 'mb-2',
    formFieldInput: 'auth-input h-12',
    formButtonPrimary: 'auth-btn-primary h-12',
    footerActionText: 'text-sm text-white/45',
    footerActionLink: 'auth-footer-link text-[#d8b76e] hover:text-[#ecd399]',
    identityPreviewEditButton: 'text-[#d8b76e]',
    formFieldAction: 'auth-footer-link text-[#d8b76e] hover:text-[#ecd399]',
    alert: 'auth-error border-red-400/20 bg-red-400/10 text-red-200',
  },
} as const

export function AuthLink({ mode }: { mode: AuthMode }) {
  return <Link className="sr-only" href={mode === 'sign-in' ? '/sign-up' : '/sign-in'} aria-label={mode === 'sign-in' ? 'Create an account' : 'Sign in'} />
}

export const authPageClass = 'min-h-dvh bg-[#111210]'

export default AuthShell
