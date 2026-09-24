import Link from 'next/link'
import { ArrowRight, Check, CircleDot, ShieldCheck, Sparkles } from 'lucide-react'

const benefits = ['One workspace for every shift', 'Live sales, stock and floor visibility', 'Role-based access for every team']

export function AuthShell({ children, mode }: { children: React.ReactNode; mode: 'sign-in' | 'sign-up' }) {
  return (
    <main className="min-h-dvh bg-[#111210] text-[#f7f4ed] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <section className="relative hidden min-h-dvh overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_20%_12%,rgba(181,142,69,0.2),transparent_34%),linear-gradient(145deg,#171812_0%,#10110f_64%)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-28 top-20 size-72 rounded-full border border-[#c8a45d]/15" />
        <div className="absolute -right-16 top-32 size-48 rounded-full border border-[#c8a45d]/10" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#c8a45d] text-[#161710] shadow-[0_0_40px_rgba(200,164,93,0.22)]">
            <CircleDot aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-[#e7d3a8]">SINGAPORE CLUB</p>
            <p className="text-xs text-white/45">Operations, beautifully aligned.</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl py-14">
          <p className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-[#c8a45d]"><Sparkles aria-hidden="true" className="size-3.5" /> Built for the floor</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-balance xl:text-6xl">A calmer way to run the room.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/55">Keep the bar, pool and club moving with one trusted operational view, from opening brief to final close.</p>
          <ul className="mt-10 flex flex-col gap-4">
            {benefits.map((benefit) => <li className="flex items-center gap-3 text-sm text-white/75" key={benefit}><span className="flex size-5 items-center justify-center rounded-full bg-[#c8a45d]/15 text-[#d8b76e]"><Check aria-hidden="true" className="size-3" /></span>{benefit}</li>)}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/35">
          <span>Private workspace access</span>
          <span className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-3.5" /> Secure by Clerk</span>
        </div>
      </section>

      <section className="flex min-h-dvh flex-col justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#c8a45d] text-[#161710]"><CircleDot aria-hidden="true" className="size-5" /></div>
            <div><p className="text-sm font-semibold tracking-[0.18em] text-[#e7d3a8]">SINGAPORE CLUB</p><p className="text-xs text-white/45">Operations, beautifully aligned.</p></div>
          </div>
          <div className="mb-7">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#c8a45d]">{mode === 'sign-in' ? 'Welcome back' : 'Your workspace awaits'}</p>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-white">{mode === 'sign-in' ? 'Sign in to your club.' : 'Create your account.'}</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">{mode === 'sign-in' ? 'Pick up where your team left off.' : 'Join the team and keep every shift in sync.'}</p>
          </div>
          {children}
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-white/30"><ArrowRight aria-hidden="true" className="size-3" /> Access is managed by your club administrator.</p>
        </div>
      </section>
    </main>
  )
}

export const clerkAppearance = {
  variables: {
    colorPrimary: '#c8a45d',
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
    socialButtonsBlockButton: 'h-12 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]',
    socialButtonsBlockButtonText: 'text-sm font-medium',
    dividerLine: 'bg-white/10',
    dividerText: 'text-white/30 text-xs',
    formFieldLabel: 'text-xs font-medium text-white/65',
    formFieldInput: 'h-12 border-white/10 bg-white/[0.04] text-sm shadow-none placeholder:text-white/25 focus:border-[#c8a45d] focus:ring-[#c8a45d]/20',
    formButtonPrimary: 'h-12 bg-[#c8a45d] text-sm font-semibold text-[#181912] shadow-[0_8px_24px_rgba(200,164,93,0.16)] hover:bg-[#d8b76e]',
    footerAction: 'border-t border-white/10 pt-6',
    footerActionText: 'text-sm text-white/45',
    footerActionLink: 'font-medium text-[#d8b76e] hover:text-[#ecd399]',
    identityPreviewEditButton: 'text-[#d8b76e]',
    formFieldAction: 'text-[#d8b76e] hover:text-[#ecd399]',
    alert: 'border-red-400/20 bg-red-400/10 text-red-200',
  },
} as const

export function AuthLink({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return <Link className="sr-only" href={mode === 'sign-in' ? '/sign-up' : '/sign-in'} aria-label={mode === 'sign-in' ? 'Create an account' : 'Sign in'} />
}

export const authPageClass = 'min-h-dvh bg-[#111210]'

export default AuthShell
