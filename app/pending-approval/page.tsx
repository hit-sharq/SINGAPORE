import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="size-8 text-primary" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-4">Access Pending</h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your account is awaiting approval from the club administrator. 
          Once approved, you&apos;ll receive an email notification and can access the dashboard.
        </p>

        <div className="space-y-3 text-sm text-muted-foreground border-t border-border pt-6">
          <p>If you believe this is an error, please contact your manager.</p>
          <p>If you haven&apos;t received an invitation, you may request one from your administrator.</p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
          >
            Return to Home
          </Link>
          <Link
            href="/sign-in?signOut=true"
            className="rounded-full border border-border px-6 py-3 font-medium transition-all hover:bg-secondary hover:border-transparent"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </main>
  )
}

export const dynamic = 'force-dynamic'