'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function AdminBackLink({ href = '/dashboard', label = 'Back to Overview' }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs font-medium text-[#a4a59e] transition hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-white"
    >
      <ChevronLeft size={14} />
      {label}
    </Link>
  )
}
