"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-sm border-b border-border' : 'bg-transparent'}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="font-semibold tracking-tight text-xl" aria-label="Singapore Club home">
            Singapore Club
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
            >
              Get started
              <ArrowRight className="ml-1.5 inline size-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Big, Bold, Minimal */}
      <section className="relative flex-1 flex items-center justify-center pt-20 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 size-[600px] rounded-full bg-primary/5 blur-[200px]" />
          <div className="absolute bottom-0 left-0 size-[500px] rounded-full bg-accent/5 blur-[200px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 text-center">
          <h1 className="font-black tracking-[-0.04em] leading-[0.92] text-5xl sm:text-7xl lg:text-9xl xl:text-[10rem] text-foreground/95">
            SINGAPORE
            <br />
            <span className="text-foreground/60">CLUB</span>
          </h1>

          <p className="mt-8 max-w-2xl mx-auto text-lg leading-8 text-muted-foreground">
            Operations platform for hospitality teams. POS, orders, inventory, staff, tables, reports — one system.
          </p>

          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="group w-full sm:w-auto rounded-full bg-primary px-10 py-5 font-medium text-primary-foreground text-base transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px] hover:shadow-primary/30">
              Get started
              <ArrowRight className="ml-2.5 inline size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto rounded-full border border-border px-10 py-5 font-medium text-base transition-all hover:bg-secondary hover:border-transparent">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2025 Singapore Club. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition">Privacy</a>
            <a href="#" className="hover:text-foreground transition">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export const dynamic = 'force-dynamic'