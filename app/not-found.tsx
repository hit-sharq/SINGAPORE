'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-[#111210] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-semibold mb-2">404</h1>
            <p className="text-[#878981]">Page not found</p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <head>
        <title>Page Not Found - Singapore Club</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && systemDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            html.dark { color-scheme: dark; }
          `
        }} />
      </head>
      <body className="min-h-screen bg-[#111210] text-[#f3f0e9] antialiased">
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-[#d8a85b]/10 mb-6">
              <svg className="size-8 text-[#d8a85b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1 className="text-6xl font-semibold tracking-tight mb-2">404</h1>
            <h2 className="text-2xl font-medium text-[#878981] mb-4">Page not found</h2>
            <p className="text-[#777971] mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>

            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full flex items-center justify-center gap-2 rounded-md bg-[#d8a85b] py-3 text-sm font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Go to homepage
              </Link>

              <Link
                href="/dashboard"
                className="block w-full flex items-center justify-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] py-3 text-sm font-semibold text-[#d0d0c9] hover:bg-white/[0.08] transition"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Go to dashboard
              </Link>
            </div>

            <p className="mt-8 text-xs text-[#666860]">
              If you think this is a mistake, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}