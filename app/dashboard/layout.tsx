'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import {
  LayoutDashboard,
  ShoppingBag,
  CircleDollarSign,
  Table2,
  Package,
  Users,
  Shield,
  BarChart3,
  UserCog,
  LogOut,
  Spade,
  X,
  Menu,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const roleLabels: Record<string, string> = {
  ADMIN: 'General Manager',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  BARTENDER: 'Bartender',
  WAITER: 'Waiter',
  INVENTORY_MANAGER: 'Inventory Manager',
}

type StaffInfo = { name: string; role: string; roles: string[] }

const workspaceNav = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER', 'INVENTORY_MANAGER'] },
  { label: 'Point of Sale', icon: ShoppingBag, href: '/dashboard/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER'] },
  { label: 'Orders', icon: CircleDollarSign, href: '/dashboard/orders', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER'] },
  { label: 'Floor & Pool', icon: Table2, href: '/dashboard/floor', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER'] },
  { label: 'Inventory', icon: Package, href: '/dashboard/inventory', roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER'] },
  { label: 'Customers', icon: Users, href: '/dashboard/customers', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Admin', icon: Shield, href: '/dashboard/admin/staff', roles: ['ADMIN'] },
  { label: 'Reports', icon: BarChart3, href: '/dashboard/reports/daily', roles: ['ADMIN', 'MANAGER'] },
]

function isActiveLink(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/'
  return pathname.startsWith(href)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [staff, setStaff] = useState<StaffInfo | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setStaff(data?.data?.staff ?? null))
      .catch(() => {})
  }, [])

  const userRoles = staff?.roles ?? []
  const visibleNav = workspaceNav.filter((item) => item.roles.some((r) => userRoles.includes(r)))

  const isDashboardRoot = pathname === '/dashboard' || pathname === '/dashboard/'

  if (isDashboardRoot) {
    return <>{children}</>
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[228px] flex-col border-r border-white/[0.07] bg-[#171815] lg:flex">
        <Link href="/dashboard" className="flex h-[76px] items-center gap-3 border-b border-white/[0.07] px-6">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#d8a85b] text-[#171815]">
            <Spade size={19} fill="currentColor" />
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-[0.2em]">SINGAPORE</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.23em] text-[#898a82]">Club operations</p>
          </div>
        </Link>
        <div className="px-3 pt-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71736c]">Workspace</p>
          <nav className="flex flex-col gap-1">
            {visibleNav.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition w-full ${
                  isActiveLink(href, pathname)
                    ? 'bg-[#d8a85b]/12 font-medium text-[#e5ba72]'
                    : 'text-[#a4a59e] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon size={17} strokeWidth={1.7} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/[0.07] p-4">
          {staff && (
            <div className="flex items-center gap-3 border-b border-white/[0.07] pb-3 mb-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#8a6655] text-xs font-semibold">
                {getInitials(staff.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{staff.name}</p>
                <p className="text-[10px] text-[#777971]">{roleLabels[staff.role] ?? staff.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#a4a59e] hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85%] border-r border-white/[0.07] bg-[#171815] shadow-xl transform transition-transform duration-300 lg:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-6">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#d8a85b] text-[#171815]">
            <Spade size={19} fill="currentColor" />
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-[#8c8e86] hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="px-3 pt-7 overflow-y-auto max-h-[calc(100vh-76px)]">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71736c]">Workspace</p>
          <nav className="flex flex-col gap-1">
            {visibleNav.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition w-full ${
                  isActiveLink(href, pathname)
                    ? 'bg-[#d8a85b]/12 font-medium text-[#e5ba72]'
                    : 'text-[#a4a59e] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon size={17} strokeWidth={1.7} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/[0.07] p-4">
          {staff && (
            <div className="flex items-center gap-3 border-b border-white/[0.07] pb-3 mb-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#8a6655] text-xs font-semibold">
                {getInitials(staff.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{staff.name}</p>
                <p className="text-[10px] text-[#777971]">{roleLabels[staff.role] ?? staff.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#a4a59e] hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-[56px] flex items-center justify-between bg-[#171815] border-b border-white/[0.07] px-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-[#a4a59e] hover:bg-white/[0.05] hover:text-white transition"
        >
          <Menu size={20} />
        </button>
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#d8a85b] text-[#171815]">
          <Spade size={19} fill="currentColor" />
        </div>
        <div className="w-9" />
      </div>

      <main className="dashboard-content min-h-screen bg-[#111210] lg:pt-0 pt-[56px]">
        {children}
      </main>
    </>
  )
}
