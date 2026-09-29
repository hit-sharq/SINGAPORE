'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminTabs = [
  { label: 'Staff', href: '/dashboard/admin/staff' },
  { label: 'Audit Logs', href: '/dashboard/admin/audit' },
  { label: 'Data Export', href: '/dashboard/admin/export' },
  { label: 'Feature Flags', href: '/dashboard/admin/flags' },
  { label: 'Integrations', href: '/dashboard/admin/integrations' },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-white/[0.07] pb-px">
      {adminTabs.map(({ label, href }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`whitespace-nowrap rounded-t-md border-b-2 px-3 py-2.5 text-xs font-medium transition ${
              isActive
                ? 'border-[#d8a85b] text-[#e5ba72]'
                : 'border-transparent text-[#a4a59e] hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
