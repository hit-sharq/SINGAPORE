import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

const appearance = {
  variables: {
    colorPrimary: '#d4a85a',
    colorBackground: 'transparent',
    colorText: '#f5f1e8',
    colorTextSecondary: '#a8a399',
    colorInputBackground: '#1b1c19',
    colorInputText: '#f5f1e8',
    borderRadius: '0.9rem',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    card: 'w-full bg-transparent shadow-none p-0',
    headerTitle: 'text-2xl font-semibold tracking-tight text-[#f5f1e8]',
    headerSubtitle: 'text-sm text-[#a8a399]',
    socialButtonsBlockButton: 'h-12 rounded-xl border border-white/10 bg-white/[0.04] text-[#f5f1e8] hover:bg-white/[0.08]',
    formFieldLabel: 'text-xs font-medium uppercase tracking-[0.14em] text-[#a8a399]',
    formFieldInput: 'h-12 rounded-xl border border-white/10 bg-[#1b1c19] text-[#f5f1e8] shadow-none focus:border-[#d4a85a] focus:ring-[#d4a85a]/30',
    formButtonPrimary: 'h-12 rounded-xl bg-[#d4a85a] text-sm font-semibold text-[#171814] shadow-none hover:bg-[#e1b96d]',
    footerActionText: 'text-sm text-[#a8a399]',
    footerActionLink: 'text-[#e1b96d] hover:text-[#f1cf8a]',
    formFieldErrorText: 'text-xs text-red-300',
    alertText: 'text-sm text-red-200',
    dividerLine: 'bg-white/10',
    dividerText: 'text-[#77766f]',
  },
}

export default function SignUpPage() {
  return (
    <main className="min-h-dvh bg-[#111210] text-[#f5f1e8]">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]">
        <section className="relative hidden overflow-hidden border-r border-white/[0.08] bg-[#171814] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="absolute -right-24 bottom-16 size-72 rounded-full bg-[#d4a85a]/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-[#f5f1e8] uppercase">
              <span className="grid size-9 place-items-center rounded-xl bg-[#d4a85a] text-sm font-bold text-[#171814]">S</span>
              Singapore Club
            </Link>
          </div>
          <div className="relative max-w-xl">
            <p className="mb-5 text-xs font-medium tracking-[0.25em] text-[#d4a85a] uppercase">Your team, in sync</p>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#f5f1e8] xl:text-6xl">Make the busy nights feel simple.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#a8a399]">Join your club workspace to keep service moving, stock visible, and every handoff clear.</p>
          </div>
          <p className="relative text-xs text-[#77766f]">Singapore Club Operations · Private workspace</p>
        </section>
        <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-[#f5f1e8] uppercase">
                <span className="grid size-9 place-items-center rounded-xl bg-[#d4a85a] text-sm font-bold text-[#171814]">S</span>
                Singapore Club
              </Link>
            </div>
            <SignUp appearance={appearance} fallbackRedirectUrl="/" />
          </div>
        </section>
      </div>
    </main>
  )
}
