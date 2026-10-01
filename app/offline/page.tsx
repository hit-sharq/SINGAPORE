import Link from 'next/link'

export const metadata = {
  title: 'No connection · Singapore Club',
}

export default function OfflinePage() {
  return (
    <main className="auth-bg auth-shell min-h-dvh text-[#f7f4ed]">
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="auth-eyebrow justify-center">Singapore Club</p>
        <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">No connection</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
          This device cannot reach the club server. Check the WiFi, then try again.
        </p>
        <Link
          href="/dashboard"
          className="auth-btn-primary mt-8 w-auto px-8"
        >
          Try again
        </Link>
      </div>
    </main>
  )
}
