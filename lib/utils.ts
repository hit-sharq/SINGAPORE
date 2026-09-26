import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'KES 0'
  return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCompactPrice(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'KES 0'
  if (num >= 1000000) return `KES ${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `KES ${(num / 1000).toFixed(1)}K`
  return `KES ${num.toFixed(0)}`
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '—'
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

export function formatDate(): string {
  return new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    PESAPAL: 'Pesapal',
    MPESA: 'M-Pesa',
    OTHER: 'Other',
  }
  return labels[method] || method
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getOrderPaymentStatus(order: any): { label: string; color: string } {
  const hasPayments = order.payments && order.payments.length > 0
  const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0
  const orderTotal = parseFloat(order.total)
  if (!hasPayments) return { label: 'UNPAID', color: 'text-[#dc8c72]' }
  if (totalPaid >= orderTotal) return { label: 'PAID', color: 'text-[#7cc58f]' }
  if (totalPaid > 0) return { label: 'PARTIAL', color: 'text-[#d8a85b]' }
  return { label: 'UNPAID', color: 'text-[#dc8c72]' }
}

export function computeChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) return { text: current > 0 ? 'New' : 'No change', positive: current >= 0 }
  const pct = ((current - previous) / previous) * 100
  return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 }
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getTableDetail(table: any): string {
  if (!table) return '—'
  const parts = []
  if (table.currentOrder) parts.push(`Order #${table.currentOrder.number}`)
  if (table.guestCount) parts.push(`${table.guestCount} guests`)
  return parts.join(' · ') || 'Available'
}

export function getTableGuest(table: any): string | undefined {
  if (!table?.currentOrder) return undefined
  return table.currentOrder.guestName || 'Walk-in'
}