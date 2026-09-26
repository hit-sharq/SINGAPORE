'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  useEffect(() => {
    try {
      const theme = localStorage.getItem('theme')
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (theme === 'dark' || (!theme && systemDark)) {
        document.documentElement.classList.add('dark')
      }
    } catch (e) {}
  }, [])

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] antialiased flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-[#dc8c72]/10 mb-4">
            <svg className="size-8 text-[#dc8c72]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-[#878981]">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        <div className="border border-white/[0.08] bg-[#181a17] rounded-xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-[#787a73] mb-1">Error Message</p>
              <p className="text-sm font-mono text-[#d8a85b] break-all">{error.message || 'Unknown error'}</p>
            </div>

            {error.digest && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-[#787a73] mb-1">Error ID</p>
                <p className="text-sm font-mono text-[#777971]">{error.digest}</p>
              </div>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-sm text-[#d8a85b] hover:text-[#e4b96d] transition"
            >
              <span>{showDetails ? 'Hide' : 'Show'} technical details</span>
              <svg className={`size-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showDetails && (
              <details className="border border-white/[0.05] rounded-lg p-4 bg-[#111210]">
                <summary className="text-xs uppercase tracking-[0.1em] text-[#787a73] cursor-pointer mb-2">
                  Stack Trace
                </summary>
                <pre className="text-[11px] font-mono text-[#777971] overflow-x-auto max-h-64">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#d8a85b] py-3 text-sm font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7" />
              <path d="M15 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Try again
          </button>

          <Link
            href="/"
            className="block w-full flex items-center justify-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] py-3 text-sm font-semibold text-[#d0d0c9] hover:bg-white/[0.08] transition"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to homepage
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] py-3 text-sm font-semibold text-[#d0d0c9] hover:bg-white/[0.08] transition"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Full page reload
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-[#666860]">
          If this persists, please contact support with the Error ID above.
        </p>
      </div>
    </div>
  )
}