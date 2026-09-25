import Link from 'next/link'
import { ArrowUpRight, Check, Play, Sparkles } from 'lucide-react'

const benefits = ['One clear source of truth', 'Built for focused teams', 'Ready when you are']

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/15"><Sparkles className="size-4" /></span>
          <span>Singapore Club</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#overview" className="transition hover:text-foreground">Overview</a>
          <a href="#principles" className="transition hover:text-foreground">Principles</a>
          <a href="#access" className="transition hover:text-foreground">Access</a>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/sign-in" className="rounded-full px-2 py-2 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:px-4 sm:text-sm">Sign in</Link>
          <Link href="/sign-up" className="rounded-full bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg">Get started <ArrowUpRight className="ml-1 inline size-4" /></Link>
        </div>
      </nav>

      <section id="overview" className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-32 lg:pt-24">
        <div className="relative z-10 max-w-2xl animate-fade-up">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"><span className="size-1.5 rounded-full bg-accent-foreground" /> One system for the whole club</div>
          <h1 className="text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl lg:text-[5.8rem]">Run every shift with <span className="text-muted-foreground">more control.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">Singapore Club connects point of sale, orders, inventory, staff, tables, and reporting — giving your team the operational clarity to serve every guest brilliantly.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/sign-up" className="group rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground transition hover:-translate-y-1 hover:shadow-xl">Open your workspace <ArrowUpRight className="ml-2 inline size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
            <a href="#principles" className="rounded-full border border-border px-6 py-3.5 font-medium transition hover:bg-secondary"><Play className="mr-2 inline size-4 fill-current" /> See how it works</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">{benefits.map((benefit) => <span key={benefit}><Check className="mr-1.5 inline size-3.5" />{benefit}</span>)}</div>
        </div>
        <div className="relative min-h-[390px] animate-fade-in lg:min-h-[520px]">
          <div className="absolute right-0 top-4 h-[88%] w-[88%] rounded-[2.5rem] border border-border bg-card p-5 shadow-2xl shadow-primary/10 sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-xs text-muted-foreground">Monday, September 28</p><h2 className="mt-1 text-xl font-medium tracking-tight">Good morning, team.</h2></div><span className="size-3 rounded-full bg-accent-foreground shadow-[0_0_20px] shadow-accent-foreground/70" /></div>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Focus this week</p><p className="mt-3 text-3xl font-semibold tracking-tight">08<span className="text-base text-muted-foreground"> / 12</span></p></div><div className="rounded-2xl bg-primary p-4 text-primary-foreground"><p className="text-xs opacity-70">Momentum</p><p className="mt-3 text-3xl font-semibold tracking-tight">84%</p></div></div>
            <div className="mt-3 rounded-2xl border border-border p-4"><div className="mb-5 flex justify-between text-xs"><span className="font-medium">Today&apos;s signal</span><span className="text-muted-foreground">See all</span></div>{['Align launch narrative','Review research notes','Share weekly update'].map((item, index) => <div key={item} className="flex items-center gap-3 border-t border-border py-3 text-sm"><span className={`size-2 rounded-full ${index === 0 ? 'bg-accent-foreground' : 'bg-muted-foreground/30'}`} /><span className={index === 0 ? 'font-medium' : 'text-muted-foreground'}>{item}</span><span className="ml-auto text-xs text-muted-foreground">{index === 0 ? 'Now' : `${index + 1}h`}</span></div>)}</div>
          </div>
          <div className="absolute -bottom-2 left-0 rounded-2xl border border-border bg-background/90 p-4 shadow-xl backdrop-blur sm:left-4"><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">Signal / 04</p><p className="mt-1 text-sm font-medium">Clarity creates velocity.</p></div>
        </div>
      </section>

      <section id="principles" className="border-y border-border bg-secondary/50 px-6 py-20 lg:px-10"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-semibold uppercase tracking-[.24em] text-muted-foreground">The Singapore Club method</p><h2 className="mt-5 max-w-md text-4xl font-semibold tracking-[-.05em] sm:text-5xl">From first order to final report.</h2></div><div className="grid gap-8 sm:grid-cols-3">{[['01','Serve','Keep every order and guest interaction moving smoothly.'],['02','Control','See sales, stock, tables, and team performance in one place.'],['03','Grow','Turn reliable operations into a better guest experience.']].map(([number,title,body]) => <div key={number} className="border-t border-border pt-4"><span className="text-xs text-muted-foreground">{number}</span><h3 className="mt-10 text-xl font-medium">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{body}</p></div>)}</div></div></section>
      <section id="access" className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-10"><p className="text-sm text-muted-foreground">Your next clear step is closer than it looks.</p><h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Build the kind of momentum your team can feel.</h2><Link href="/sign-up" className="mt-8 inline-block rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground transition hover:-translate-y-1">Get started free <ArrowUpRight className="ml-1 inline size-4" /></Link></section>
    </main>
  )
}

export const dynamic = 'force-dynamic'

