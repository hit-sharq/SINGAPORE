'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Calendar,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coffee,
  CreditCard,
  Download,
  LayoutDashboard,
  Mail,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Spade,
  Table2,
  Users,
  Wine,
  X,
  Shield,
  BarChart3,
  ClipboardList,
  Truck,
  UserCog,
  UserPlus,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react'

type Category = { name: string }
type Product = { 
  id: string; 
  name: string; 
  price: string; 
  stock: string; 
  sku: string;
  reorderAt: string;
  category: Category 
}
type TableOrder = {
  id: string
  number: number
  total: string
  createdAt: string
  payments: { method: string; status: string }[]
}
type TableInfo = {
  id: string
  name: string
  status: string
  capacity: number
  orders: TableOrder[]
}
type RecentOrder = {
  id: string
  number: number
  total: string
  status: string
  table: { name: string } | null
  payments: { method: string; status: string }[]
  createdAt: string
}
type PaymentMixEntry = { method: string; amount: string }
type LowStockProduct = { id: string; name: string; stock: string; reorderAt: string }
type HourlyRevenueEntry = { hour: number; revenue: string }
type RevenueByCategoryEntry = { category: string; amount: string }
type LastPayment = { amount: string; method: string; createdAt: string } | null
type DashboardData = {
  staff: { name: string; role: string; email: string; roles: string[] }
  revenue: string
  orderCount: number
  yesterdayRevenue: string
  yesterdayOrderCount: number
  activeTabs: number
  paymentMix: PaymentMixEntry[]
  tables: TableInfo[]
  lowStock: LowStockProduct[]
  recentOrders: RecentOrder[]
  outstanding: string
  revenueByCategory: RevenueByCategoryEntry[]
  hourlyRevenue: HourlyRevenueEntry[]
  lastPayment: LastPayment
}
type CartItem = Product & { quantity: number }
type POSViewProps = {
  products: Product[]
  categories: string[]
  activeCategory: string
  query: string
  filteredProducts: Product[]
  cart: CartItem[]
  onCategoryChange: (category: string) => void
  onQueryChange: (query: string) => void
  onAddToCart: (product: Product) => void
  onRemoveFromCart: (productId: string) => void
  cartTotal: number
  onCheckout: () => void
  showSale: boolean
  setShowSale: (showSale: boolean) => void
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER', 'INVENTORY_MANAGER'] },
  { label: 'Point of Sale', icon: ShoppingBag, roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER'] },
  { label: 'Orders', icon: CircleDollarSign, roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER'] },
  { label: 'Floor & Pool', icon: Table2, roles: ['ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER'] },
  { label: 'Inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER'] },
  { label: 'Customers', icon: Users, roles: ['ADMIN', 'MANAGER'] },
]

const adminNavItems = [
  { label: 'Admin', icon: Shield, roles: ['ADMIN'] },
  { label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Staff', icon: UserCog, roles: ['ADMIN'] },
]

const roleLabels: Record<string, string> = {
  ADMIN: 'General Manager',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  BARTENDER: 'Bartender',
  WAITER: 'Waiter',
  INVENTORY_MANAGER: 'Inventory Manager',
}

const paymentColors: Record<string, string> = {
  PESAPAL: '#d8a85b',
  CARD: '#748b76',
  CASH: '#6b6d68',
}

function formatPrice(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'KES 0'
  return `KES ${num.toLocaleString('en-US')}`
}

function formatCompactPrice(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatTimeAgo(dateString: string): string {
  const d = new Date(dateString)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  return formatTime(dateString)
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'PESAPAL':
      return 'M-Pesa'
    case 'CASH':
      return 'Cash'
    case 'CARD':
      return 'Card'
    default:
      return method
  }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getOrderPaymentStatus(order: RecentOrder): { label: string; color: string } {
  const completedPayment = order.payments?.find((p) => p.status === 'COMPLETED')
  if (completedPayment) {
    return { label: `Paid · ${paymentMethodLabel(completedPayment.method)}`, color: 'text-[#7cc58f]' }
  }
  if (order.payments?.some((p) => p.status === 'PENDING')) {
    return { label: 'Open tab', color: 'text-[#d8a85b]' }
  }
  return { label: order.status, color: 'text-[#a4a59e]' }
}

function computeChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) return { text: current > 0 ? '+100%' : '—', positive: current >= 0 }
  const pct = ((current - previous) / previous) * 100
  return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getTableDetail(table: TableInfo): string {
  const activeOrder = table.orders?.[0]
  if (table.status === 'OCCUPIED' && activeOrder) {
    return `${formatTime(activeOrder.createdAt)} · ${formatPrice(activeOrder.total)}`
  }
  if (table.status === 'AVAILABLE') return 'Ready for a new session'
  if (table.status === 'CLEANING') return 'Needs attention'
  return 'Reserved'
}

function getTableGuest(table: TableInfo): string | undefined {
  const activeOrder = table.orders?.[0]
  if (table.status === 'OCCUPIED' && activeOrder) {
    return `Tab #${activeOrder.number}`
  }
  return undefined
}

function OverviewView({ data, onOrderClick }: { data: DashboardData; onOrderClick: (orderId: string) => void }) {
  const totalRevenue = parseFloat(data.revenue)
  const foodRevenue = data.revenueByCategory
    .filter((e) => e.category.toLowerCase().includes('food'))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const poolRevenue = data.revenueByCategory
    .filter((e) => e.category.toLowerCase().includes('pool'))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const barRevenue = totalRevenue - foodRevenue - poolRevenue

  const revenueChange = computeChange(totalRevenue, parseFloat(data.yesterdayRevenue))
  const orderChange = computeChange(data.orderCount, data.yesterdayOrderCount)
  const outstandingValue = parseFloat(data.outstanding)

  const statCards = [
    { label: "Today's revenue", value: formatPrice(data.revenue), change: revenueChange.text, positive: revenueChange.positive },
    { label: 'Orders', value: data.orderCount.toString(), change: orderChange.text, positive: orderChange.positive },
    { label: 'Active tabs', value: data.activeTabs.toString(), change: '—', positive: true },
    { label: 'Pool revenue', value: formatPrice(poolRevenue), change: '—', positive: true },
    { label: 'Bar revenue', value: formatPrice(barRevenue), change: '—', positive: true },
    { label: 'Food revenue', value: formatPrice(foodRevenue), change: '—', positive: true },
    {
      label: 'Outstanding',
      value: formatPrice(data.outstanding),
      change: outstandingValue > 0 ? 'Needs attention' : 'All clear',
      positive: outstandingValue === 0,
    },
  ]

  const maxHourlyRevenue = Math.max(...data.hourlyRevenue.map((h) => parseFloat(h.revenue)), 1)
  const totalPaymentAmount = data.paymentMix.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const paymentSegments = data.paymentMix.map((p, i, arr) => {
    const pct = totalPaymentAmount > 0 ? (parseFloat(p.amount) / totalPaymentAmount) * 100 : 0
    const color = paymentColors[p.method] ?? '#806e4e'
    const prev = i > 0 ? arr.slice(0, i).reduce((s, x) => s + (totalPaymentAmount > 0 ? (parseFloat(x.amount) / totalPaymentAmount) * 100 : 0), 0) : 0
    return { method: p.method, amount: p.amount, pct, color, start: prev, end: prev + pct }
  })

  const conicGradient = paymentSegments
    .filter((s) => s.pct > 0)
    .map((s) => `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`)
    .join(', ')

  return (
    <div className="space-y-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#d8a85b]">Live operations</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em]">Tonight at Singapore</h2>
          <p className="mt-2 text-sm text-[#878981]">
            {data.activeTabs === 0 ? 'No active tabs. Ready for a fresh start.' : `${data.activeTabs} active ${data.activeTabs === 1 ? 'tab' : 'tabs'} on the floor.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]">
            <Plus size={15} />
            New sale
          </button>
          <button className="flex items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-[#d0d0c9] hover:bg-white/[0.06]">
            <CalendarDays size={15} />
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {statCards.map((card) => (
          <div key={card.label} className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-[10px] uppercase tracking-[0.11em] text-[#787a73]">{card.label}</p>
            <p className="mt-3 text-lg font-semibold tracking-tight">{card.value}</p>
            <p className={`mt-2 flex items-center gap-1 text-[10px] ${card.positive ? 'text-[#7cc58f]' : 'text-[#d8a85b]'}`}>
              {card.positive ? <ArrowUpRight size={12} /> : <Clock3 size={12} />}
              {card.change}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Revenue overview</h3>
              <p className="mt-1 text-xs text-[#777971]">Hourly performance · {formatDate()}</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-[#a5a69f]">
              This week <ChevronDown size={13} />
            </button>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-5">
            <div className="flex h-[190px] items-end gap-2 sm:gap-4">
              {data.hourlyRevenue.length === 0 ? (
                <p className="text-xs text-[#777971]">No revenue data for today yet.</p>
              ) : (
                data.hourlyRevenue.map((entry) => {
                  const height = maxHourlyRevenue > 0 ? (parseFloat(entry.revenue) / maxHourlyRevenue) * 100 : 0
                  const isCurrent = entry.hour === new Date().getHours()
                  return (
                    <div key={entry.hour} className="group flex flex-1 flex-col items-center gap-2">
                      <div
                        className={`w-full rounded-t-sm transition-all group-hover:bg-[#e5b66b] ${
                          isCurrent ? 'bg-[#d8a85b]' : entry.revenue === '0' ? 'bg-[#806e4e]/40' : 'bg-[#806e4e]'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-[9px] text-[#64665f]">
                        {entry.hour % 3 === 0 ? `${entry.hour}:00` : ''}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
            <div className="mt-5 flex items-center gap-5 border-t border-white/[0.07] pt-4 text-[10px] text-[#878981]">
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-[#d8a85b]" />
                Revenue <b className="font-medium text-[#d0d0c9]">{formatPrice(data.revenue)}</b>
              </span>
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-[#7cc58f]" />
                vs yesterday <b className="font-medium text-[#7cc58f]">+{Math.round(((totalRevenue - parseFloat(data.yesterdayRevenue)) / Math.max(parseFloat(data.yesterdayRevenue), 1)) * 100)}%</b>
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Payment activity</h3>
              <p className="mt-1 text-xs text-[#777971]">Today's collection mix</p>
            </div>
            <MoreHorizontal size={17} className="text-[#777971]" />
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-5">
            {data.paymentMix.length === 0 ? (
              <p className="text-xs text-[#777971]">No completed payments yet today.</p>
            ) : (
              <>
                <div className="flex items-center gap-5">
                  <div
                    className="relative flex size-[122px] shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${conicGradient})`,
                    }}
                  >
                    <div className="flex size-[88px] flex-col items-center justify-center rounded-full bg-[#181a17]">
                      <span className="text-lg font-semibold">{formatCompactPrice(data.revenue)}</span>
                      <span className="text-[9px] text-[#777971]">total KES</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-[11px] text-[#979991]">
                    {paymentSegments.map((p) => (
                      <span key={p.method} className="flex items-center gap-2">
                        <i
                          className="mr-2 inline-block size-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {paymentMethodLabel(p.method)} <b className="ml-2 text-[#d2d1c8]">{Math.round(p.pct)}%</b>
                      </span>
                    ))}
                  </div>
                </div>
                {data.lastPayment && (
                  <div className="mt-5 flex justify-between border-t border-white/[0.07] pt-4 text-[10px] text-[#777971]">
                    <span>
                      Last payment <b className="ml-1 text-[#d2d1c8]">{formatPrice(data.lastPayment.amount)}</b>
                    </span>
                    <span className="text-[#7cc58f]">{formatTimeAgo(data.lastPayment.createdAt)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Pool floor</h3>
              <p className="mt-1 text-xs text-[#777971]">
                {data.tables.length} {data.tables.length === 1 ? 'table' : 'tables'} ·{' '}
                {data.tables.filter((t) => t.status === 'OCCUPIED').length} in play
              </p>
            </div>
            <button className="text-xs font-medium text-[#d8a85b]">Manage floor →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.tables.length === 0 ? (
              <p className="text-xs text-[#777971]">No tables configured.</p>
            ) : (
              data.tables.map((table) => (
                <div
                  key={table.id}
                  className={`border p-4 ${
                    table.status === 'OCCUPIED'
                      ? 'border-[#d8a85b]/40 bg-[#211e17]'
                      : 'border-white/[0.08] bg-[#181a17]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-md bg-[#2d302a] text-[#b4b4aa]">
                      <Table2 size={17} />
                    </div>
                    <span
                      className={`text-[9px] font-semibold tracking-[0.12em] ${
                        table.status === 'OCCUPIED'
                          ? 'text-[#d8a85b]'
                          : table.status === 'RESERVED'
                          ? 'text-[#d78d6f]'
                          : table.status === 'CLEANING'
                          ? 'text-[#a4a59e]'
                          : 'text-[#7cc58f]'
                      }`}
                    >
                      {table.status}
                    </span>
                  </div>
                  <p className="mt-5 text-[11px] font-semibold tracking-[0.13em] text-[#d7d6ce]">{table.name}</p>
                  <p className="mt-1 text-xs text-[#777971]">{getTableDetail(table)}</p>
                  {getTableGuest(table) && (
                    <p className="mt-3 text-[10px] text-[#d8a85b]">{getTableGuest(table)}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Recent orders</h3>
              <p className="mt-1 text-xs text-[#777971]">Activity across the floor</p>
            </div>
            <button className="text-xs font-medium text-[#d8a85b]">View all →</button>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17]">
            {data.recentOrders.length === 0 ? (
              <p className="px-4 py-3.5 text-xs text-[#777971]">No recent orders.</p>
            ) : (
              data.recentOrders.map((order, i) => {
                const status = getOrderPaymentStatus(order)
                return (
                  <div
                    key={order.id}
                    onClick={() => onOrderClick(order.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer ${i ? 'border-t border-white/[0.06]' : ''} hover:bg-white/[0.03]`}
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#2a2d27] text-[10px] text-[#b1b1a8]">
                      #{order.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">
                        {order.table ? `${order.table.name} Guest` : 'Walk-in Guest'}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#777971]">
                        #{order.number} · {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{formatPrice(order.total)}</p>
                      <p className={`mt-0.5 text-[10px] ${status.color}`}>{status.label}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function POSView({ products, categories, activeCategory, query, filteredProducts, cart, onCategoryChange, onQueryChange, onAddToCart, onRemoveFromCart, cartTotal, onCheckout, showSale, setShowSale }: POSViewProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowSale(false)}>
      <div className="w-full max-w-5xl border border-white/[0.1] bg-[#171815] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Point of sale</p>
            <h2 className="mt-1 text-lg font-semibold">New customer tab</h2>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowSale(false) }} className="text-[#8c8e86] hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid lg:grid-cols-[1fr_310px]">
          <div className="p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777971]" size={16} />
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search products..."
                className="w-full border border-white/[0.1] bg-[#20221e] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
              />
            </div>
            <div className="my-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-xs ${
                    activeCategory === category
                      ? 'bg-[#d8a85b] font-semibold text-[#1b1914]'
                      : 'bg-white/[0.04] text-[#a4a59e] hover:bg-white/[0.08]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredProducts.length === 0 ? (
                <p className="col-span-full text-xs text-[#777971]">No products found.</p>
              ) : (
                filteredProducts.map((product) => {
                  const tone = product.category.name.toLowerCase().includes('food') ? 'food' : 'drink'
                  return (
                    <button
                      key={product.id}
                      onClick={() => onAddToCart(product)}
                      className="border border-white/[0.08] bg-[#1d1f1b] p-3 text-left transition hover:border-[#d8a85b]/60 hover:bg-[#24241e]"
                    >
                      <div
                        className={`mb-5 flex size-9 items-center justify-center rounded-md text-[#d8a85b] ${
                          tone === 'food' ? 'bg-[#6b4c35]/30' : 'bg-[#4e5143]'
                        }`}
                      >
                        {product.category.name.toLowerCase().includes('food') ? (
                          <Coffee size={17} />
                        ) : (
                          <Wine size={17} />
                        )}
                      </div>
                      <p className="text-xs font-medium">{product.name}</p>
                      <p className="mt-1 text-xs text-[#878981]">{product.category.name}</p>
                      <p className="mt-2 text-sm font-semibold">{formatPrice(product.price)}</p>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="border-t border-white/[0.08] lg:border-l lg:border-t-0 lg:border-l-white/[0.08] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#787a73]">
                Tab · {cart.length} items
              </p>
              <Activity size={15} className="text-[#777971]" />
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag size={32} className="mx-auto mb-3 text-[#777971]" />
                <p className="text-sm text-[#777971]">Add products to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.name}</p>
                      <p className="text-[10px] text-[#777971]">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="ml-2 text-[#777971] hover:text-[#dc8c72]"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 border-t border-white/[0.07]">
              <div className="flex justify-between border-b border-white/[0.06] py-2 text-[10px] text-[#777971]">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] py-2 text-[10px] text-[#777971]">
                <span>Tax</span>
                <span>KES 0</span>
              </div>
              <div className="flex justify-between py-2 text-xs font-semibold">
                <span>Total</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={onCheckout}
              className="mt-4 w-full rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send to table
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersView({ data, onOrderClick }: { data: DashboardData; onOrderClick: (orderId: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Orders</h2>
          <p className="text-sm text-[#878981]">All orders across the venue</p>
        </div>
        <button className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]">
          <Plus size={15} />
          New Order
        </button>
      </div>
      <div className="border border-white/[0.08] bg-[#181a17]">
        {data.recentOrders.length === 0 ? (
          <p className="px-4 py-3.5 text-xs text-[#777971]">No orders found.</p>
        ) : (
          data.recentOrders.map((order, i) => {
            const status = getOrderPaymentStatus(order)
            return (
              <div
                key={order.id}
                onClick={() => onOrderClick(order.id)}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer ${i ? 'border-t border-white/[0.06]' : ''} hover:bg-white/[0.03]`}
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-[#2a2d27] text-[10px] text-[#b1b1a8]">
                  #{order.number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">
                    {order.table ? `${order.table.name} Guest` : 'Walk-in Guest'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#777971]">
                    #{order.number} · {formatTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">{formatPrice(order.total)}</p>
                  <p className={`mt-0.5 text-[10px] ${status.color}`}>{status.label}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#777971]">
                  {order.payments.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white/[0.05]">
                      {paymentMethodLabel(p.method)}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function FloorView({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const [showAddTable, setShowAddTable] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState(4)
  const [updatingTable, setUpdatingTable] = useState<string | null>(null)

  const handleAddTable = async () => {
    if (!newTableName.trim()) return
    setUpdatingTable('add')
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName.trim(), capacity: newTableCapacity }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create table')
      }
      setShowAddTable(false)
      setNewTableName('')
      setNewTableCapacity(4)
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create table')
    } finally {
      setUpdatingTable(null)
    }
  }

  const handleStatusChange = async (tableId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING') => {
    setUpdatingTable(tableId)
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update table')
      }
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update table')
    } finally {
      setUpdatingTable(null)
    }
  }

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    if (!confirm(`Delete table "${tableName}"? This cannot be undone.`)) return
    setUpdatingTable(tableId)
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete table')
      }
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete table')
    } finally {
      setUpdatingTable(null)
    }
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: '#7cc58f',
    OCCUPIED: '#d8a85b',
    RESERVED: '#d78d6f',
    CLEANING: '#a4a59e',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Floor & Pool</h2>
          <p className="text-sm text-[#878981]">Table management and pool floor</p>
        </div>
        <button
          onClick={() => setShowAddTable(true)}
          className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"
        >
          <Plus size={15} />
          Add Table
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {data.tables.length === 0 ? (
          <p className="col-span-full text-xs text-[#777971]">No tables configured.</p>
        ) : (
          data.tables.map((table) => (
            <div
              key={table.id}
              className={`border p-4 ${
                table.status === 'OCCUPIED'
                  ? 'border-[#d8a85b]/40 bg-[#211e17]'
                  : 'border-white/[0.08] bg-[#181a17]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#2d302a] text-[#b4b4aa]">
                  <Table2 size={17} />
                </div>
                <span
                  className={`text-[9px] font-semibold tracking-[0.12em] ${
                    table.status === 'OCCUPIED'
                      ? 'text-[#d8a85b]'
                      : table.status === 'RESERVED'
                      ? 'text-[#d78d6f]'
                      : table.status === 'CLEANING'
                      ? 'text-[#a4a59e]'
                      : 'text-[#7cc58f]'
                  }`}
                >
                  {table.status}
                </span>
              </div>
              <p className="mt-5 text-[11px] font-semibold tracking-[0.13em] text-[#d7d6ce]">{table.name}</p>
              <p className="mt-1 text-xs text-[#777971]">{getTableDetail(table)}</p>
              {getTableGuest(table) && (
                <p className="mt-3 text-[10px] text-[#d8a85b]">{getTableGuest(table)}</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                {(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] as const).map((status) => (
                  <button
                    key={status}
                    disabled={updatingTable === table.id || table.status === status}
                    onClick={() => handleStatusChange(table.id, status)}
                    className={`flex-1 text-[9px] font-semibold px-2 py-1.5 rounded ${
                      table.status === status
                        ? `bg-${statusColors[status]}/20 text-${statusColors[status]}`
                        : 'bg-white/[0.04] text-[#777971] hover:bg-white/[0.08]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleDeleteTable(table.id, table.name)}
                  disabled={updatingTable === table.id}
                  className="flex-1 text-[9px] text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Add Table</p>
                <h2 className="mt-1 text-lg font-semibold">New table</h2>
              </div>
              <button onClick={() => setShowAddTable(false)} className="text-[#8c8e86] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#777971] mb-1">Table Name</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. Pool Table 1"
                  className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#777971] mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddTable(false)}
                  className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTable}
                  disabled={updatingTable === 'add' || !newTableName.trim()}
                  className="flex-1 rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingTable === 'add' ? 'Adding...' : 'Create Table'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InventoryView({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    async function loadInventory() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ])
        if (prodRes.ok) setProducts(await prodRes.json())
        if (catRes.ok) setCategories(await catRes.json())
      } catch (err) {
        console.error('Failed to load inventory:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInventory()
  }, [])

  const handleAddProduct = async (formData: FormData) => {
    const productData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      categoryId: formData.get('categoryId') as string,
      price: formData.get('price') as string,
      costPrice: formData.get('costPrice') as string,
      stock: formData.get('stock') as string,
      reorderAt: formData.get('reorderAt') as string,
      status: formData.get('status') as 'ACTIVE' | 'INACTIVE',
    }
    setSaving('add')
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }
      const newProduct = await response.json()
      setProducts((prev) => [...prev, newProduct].sort((a, b) => a.category.name.localeCompare(b.category.name)))
      setShowAddProduct(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setSaving(null)
    }
  }

  const handleAddCategory = async (name: string) => {
    setSaving('category')
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
      }
      const newCategory = await response.json()
      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
      setShowAddCategory(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setSaving(null)
    }
  }

  const handleUpdateProduct = async (formData: FormData) => {
    if (!editingProduct) return
    const productData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      categoryId: formData.get('categoryId') as string,
      price: formData.get('price') as string,
      costPrice: formData.get('costPrice') as string,
      stock: formData.get('stock') as string,
      reorderAt: formData.get('reorderAt') as string,
      status: formData.get('status') as 'ACTIVE' | 'INACTIVE',
    }
    setSaving(editingProduct.id)
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }
      const updated = await response.json()
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)))
      setEditingProduct(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setSaving(null)
    }
  }

  const handleAdjustStock = async (productId: string, quantity: number, reason: string) => {
    setSaving(productId)
    try {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: quantity.toString(), reason }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to adjust stock')
      }
      const result = await response.json()
      setProducts((prev) => prev.map((p) => (p.id === productId ? result.product : p)))
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete product "${productName}"? This cannot be undone.`)) return
    setSaving(productId)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setSaving(null)
    }
  }

  const getStockStatus = (product: Product) => {
    const stock = parseFloat(product.stock)
    const reorder = parseFloat(product.reorderAt)
    if (stock <= 0) return { label: 'OUT', color: 'text-red-400', bg: 'bg-red-500/20' }
    if (stock <= reorder) return { label: 'LOW', color: 'text-[#d8a85b]', bg: 'bg-[#d8a85b]/20' }
    return { label: 'OK', color: 'text-[#7cc58f]', bg: 'bg-[#7cc58f]/20' }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Inventory</h2>
            <p className="text-sm text-[#878981]">Stock levels and low stock alerts</p>
          </div>
        </div>
        <div className="border border-white/[0.08] bg-[#181a17] p-8 text-center text-[#777971]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Inventory</h2>
          <p className="text-sm text-[#878981]">Stock levels and low stock alerts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"
          >
            <Plus size={15} />
            Add Product
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]"
          >
            <Plus size={15} />
            Add Category
          </button>
        </div>
      </div>

      <div className="border border-white/[0.08] bg-[#181a17]">
        <div className="grid grid-cols-8 gap-3 px-4 py-3 border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-[0.1em] text-[#787a73]">
          <div>Product</div>
          <div>SKU</div>
          <div>Category</div>
          <div className="text-right">Stock</div>
          <div className="text-right">Reorder</div>
          <div className="text-right">Status</div>
          <div className="text-right">Price</div>
          <div></div>
        </div>
        {products.length === 0 ? (
          <p className="px-4 py-8 text-center text-[#777971]">No products yet. Add your first product.</p>
        ) : (
          products.map((product, i) => {
            const status = getStockStatus(product)
            const isEditing = editingProduct?.id === product.id
            return (
              <form
                key={product.id}
                onSubmit={(e) => { if (isEditing) { e.preventDefault(); handleUpdateProduct(new FormData(e.currentTarget)) } }}
                className="grid grid-cols-8 gap-3 px-4 py-3 border-t border-white/[0.04] items-center"
                data-product-id={product.id}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{product.name}</p>
                  {isEditing && (
                    <input
                      name="name"
                      type="text"
                      defaultValue={product.name}
                      className="w-full h-8 rounded-md border border-white/[0.1] bg-[#20221e] px-2 text-xs outline-none focus:border-[#d8a85b]/60"
                    />
                  )}
                </div>
                <p className="text-xs text-[#777971] font-mono">{product.sku ?? '\u2014'}</p>
                <p className="text-xs text-[#777971]">{product.category.name}</p>
                <div className="text-right">
                  {isEditing ? (
                    <input
                      name="stock"
                      type="number"
                      step="0.001"
                      defaultValue={product.stock}
                      className="w-20 h-8 rounded-md border border-white/[0.1] bg-[#20221e] px-2 text-xs text-right outline-none focus:border-[#d8a85b]/60"
                    />
                  ) : (
                    <p className="text-xs font-medium">{parseFloat(product.stock).toFixed(3)}</p>
                  )}
                </div>
                <p className="text-right text-xs text-[#777971]">{parseFloat(product.reorderAt).toFixed(3)}</p>
                <span className={`text-right text-[9px] font-semibold px-2 py-0.5 rounded ${status.color} ${status.bg}`}>
                  {status.label}
                </span>
                <p className="text-right text-xs text-[#777971]">{formatPrice(product.price)}</p>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        type="submit"
                        disabled={saving === product.id}
                        className="text-[9px] text-[#7cc58f] hover:underline"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="text-[9px] text-[#d8a85b] hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="text-[9px] text-[#d8a85b] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(product.id, 1, 'Manual restock')}
                        disabled={saving === product.id}
                        className="text-[9px] text-[#7cc58f] hover:underline"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(product.id, -1, 'Manual adjustment')}
                        disabled={saving === product.id || parseFloat(product.stock) <= 0}
                        className="text-[9px] text-[#dc8c72] hover:underline"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="text-[9px] text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </form>
            )
          })
        )}

        </div>

        {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4 bg-[#171815] z-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Add Product</p>
                <h2 className="mt-1 text-lg font-semibold">New inventory item</h2>
              </div>
              <button onClick={() => setShowAddProduct(false)} className="text-[#8c8e86] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(new FormData(e.currentTarget)) }} className="p-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Name *</label>
                  <input name="name" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" placeholder="Product name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">SKU *</label>
                  <input name="sku" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" placeholder="Unique SKU" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Category *</label>
                  <select name="categoryId" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Status</label>
                  <select name="status" defaultValue="ACTIVE" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Price (KES) *</label>
                  <input name="price" type="number" step="0.01" min="0" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Cost Price (KES) *</label>
                  <input name="costPrice" type="number" step="0.01" min="0" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Initial Stock</label>
                  <input name="stock" type="number" step="0.001" min="0" defaultValue="0" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Reorder Level</label>
                  <input name="reorderAt" type="number" step="0.001" min="0" defaultValue="0" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" placeholder="0" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]">
                  Cancel
                </button>
                <button type="submit" disabled={saving === 'add'} className="flex-1 rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving === 'add' ? 'Adding...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Add Category</p>
                <h2 className="mt-1 text-lg font-semibold">New category</h2>
              </div>
              <button onClick={() => setShowAddCategory(false)} className="text-[#8c8e86] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#777971] mb-1">Category Name</label>
                <input
                  type="text"
                  id="newCategoryName"
                  placeholder="e.g. Spirits, Beer, Food"
                  className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddCategory(false)} className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]">
                  Cancel
                </button>
                <button
                  onClick={() => handleAddCategory((document.getElementById('newCategoryName') as HTMLInputElement).value)}
                  disabled={saving === 'category'}
                  className="flex-1 rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving === 'category' ? 'Adding...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
</div>
  )
}

function CustomersView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Customers</h2>
          <p className="text-sm text-[#878981]">Customer management and history</p>
        </div>
        <button className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]">
          <Plus size={15} />
          Add Customer
        </button>
      </div>
      <div className="border border-white/[0.08] bg-[#181a17]">
        <p className="px-4 py-8 text-center text-[#777971]">Customer management coming soon</p>
      </div>
    </div>
  )
}

function AdminView({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<'staff' | 'settings' | 'integrations' | 'audit' | 'flags' | 'export'>('staff')

  const tabs = [
    { id: 'staff', label: 'Staff Management', icon: UserCog, desc: 'Manage roles, permissions, and invites' },
    { id: 'settings', label: 'System Settings', icon: Settings, desc: 'Venue config, tax rules, receipt templates' },
    { id: 'integrations', label: 'Integrations', icon: CreditCard, desc: 'Pesapal, printers, payment terminals' },
    { id: 'audit', label: 'Audit Logs', icon: ClipboardList, desc: 'Track all system changes and actions' },
    { id: 'flags', label: 'Feature Flags', icon: Activity, desc: 'Toggle features across the venue' },
    { id: 'export', label: 'Data Export', icon: Truck, desc: 'Export reports and backups' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Shield size={22} className="text-[#d8a85b]" />
            Admin Panel
          </h2>
          <p className="text-sm text-[#878981]">System administration and configuration</p>
        </div>
      </div>
      <div className="flex gap-1 border-b border-white/[0.08] overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'text-[#d8a85b] border-b-2 border-[#d8a85b]'
                : 'text-[#787a73] hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="border border-white/[0.08] bg-[#181a17] rounded-lg p-6 min-h-[400px]">
        {activeTab === 'staff' && <StaffView data={data} />}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="font-semibold">System Settings</h3>
            <p className="text-[#777971]">Venue configuration, tax rules, receipt templates - coming soon</p>
          </div>
        )}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Integrations</h3>
            <p className="text-[#777971]">Pesapal, printers, payment terminals - coming soon</p>
          </div>
        )}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Audit Logs</h3>
            <p className="text-[#777971]">Track all system changes and actions - coming soon</p>
          </div>
        )}
        {activeTab === 'flags' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Feature Flags</h3>
            <p className="text-[#777971]">Toggle features across the venue - coming soon</p>
          </div>
        )}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Data Export</h3>
            <p className="text-[#777971]">Export reports and backups - use Reports tab for now</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ReportsView({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<'daily' | 'products' | 'reconciliation'>('daily')
  const [dailyReport, setDailyReport] = useState<any>(null)
  const [productsReport, setProductsReport] = useState<any>(null)
  const [reconReport, setReconReport] = useState<any>(null)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const fetchReport = async () => {
      try {
        if (activeTab === 'daily') {
          const res = await fetch(`/api/reports/daily?date=${reportDate}`)
          if (res.ok) setDailyReport(await res.json())
        } else if (activeTab === 'products') {
          const res = await fetch('/api/reports/products?days=30')
          if (res.ok) setProductsReport(await res.json())
        } else {
          const res = await fetch(`/api/reports/reconciliation?date=${reportDate}`)
          if (res.ok) setReconReport(await res.json())
        }
      } catch (e) {
        console.error('Failed to load report:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [activeTab, reportDate])

  const formatKES = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val
    return `KES ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const renderDaily = () => {
    if (!dailyReport) return <div className="text-center py-8 text-[#777971]">Loading...</div>
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Revenue</p>
            <p className="mt-1 text-2xl font-semibold">{formatKES(dailyReport.revenue)}</p>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Orders</p>
            <p className="mt-1 text-2xl font-semibold">{dailyReport.orderCount}</p>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Avg Order</p>
            <p className="mt-1 text-2xl font-semibold">{formatKES(dailyReport.avgOrderValue)}</p>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Voids / Refunds</p>
            <p className="mt-1 text-2xl font-semibold">{dailyReport.voids} / {dailyReport.refunds}</p>
          </div>
        </div>
        <div className="border border-white/[0.08] bg-[#181a17] p-4">
          <h3 className="font-semibold mb-3">Payment Mix</h3>
          <div className="flex flex-wrap gap-4">
            {dailyReport.paymentMix.map((p: any) => (
              <div key={p.method} className="text-sm">
                <span className="text-[#787a73]">{p.method}:</span>{' '}
                <span className="font-medium">{formatKES(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-white/[0.08] bg-[#181a17] p-4">
          <h3 className="font-semibold mb-3">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.topProducts.map((p: any) => (
                  <tr key={p.name} className="border-b border-white/[0.03]">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-right">{p.sold}</td>
                    <td className="py-2 text-right">{formatKES(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderProducts = () => {
    if (!productsReport) return <div className="text-center py-8 text-[#777971]">Loading...</div>
    return (
      <div className="space-y-4">
        <div className="border border-white/[0.08] bg-[#181a17] p-4">
          <h3 className="font-semibold mb-3">Product Performance (Last {productsReport.periodDays} Days)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Stock</th>
                  <th className="pb-2 text-right">Reorder</th>
                  <th className="pb-2 text-right">Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                  <th className="pb-2 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {productsReport.products.map((p: any) => (
                  <tr key={p.id} className="border-b border-white/[0.03]">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-[#787a73]">{p.category || '-'}</td>
                    <td className="py-2 text-right">{parseFloat(p.stock).toFixed(1)}</td>
                    <td className="py-2 text-right">{parseFloat(p.reorderAt).toFixed(1)}</td>
                    <td className="py-2 text-right">{p.sold}</td>
                    <td className="py-2 text-right">{formatKES(p.revenue)}</td>
                    <td className="py-2 text-right">{p.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="border border-white/[0.08] bg-[#181a17] p-4">
          <h3 className="font-semibold mb-3">Recent Stock Movements</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {productsReport.stockMovements.slice(0, 20).map((m: any) => (
                  <tr key={m.id} className="border-b border-white/[0.03]">
                    <td className="py-2">{m.product}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${m.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2 text-right">{m.quantity}</td>
                    <td className="py-2 text-[#787a73]">{m.reason}</td>
                    <td className="py-2 text-[#787a73]">{formatTime(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderReconciliation = () => {
    if (!reconReport) return <div className="text-center py-8 text-[#777971]">Loading...</div>
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Pesapal</p>
            <p className="mt-1 text-xl font-semibold">{formatKES(reconReport.totals.pesapal)} ({reconReport.counts.pesapal})</p>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Card</p>
            <p className="mt-1 text-xl font-semibold">{formatKES(reconReport.totals.card)} ({reconReport.counts.card})</p>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Cash</p>
            <p className="mt-1 text-xl font-semibold">{formatKES(reconReport.totals.cash)} ({reconReport.counts.cash})</p>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4 border-[#d8a85b]/30">
            <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Total</p>
            <p className="mt-1 text-xl font-semibold text-[#d8a85b]">{formatKES(reconReport.totals.grand)}</p>
          </div>
        </div>
        {reconReport.discrepancies.length > 0 && (
          <div className="border border-red-500/30 bg-red-500/10 p-4">
            <h3 className="font-semibold text-red-400 mb-2">Discrepancies Requiring Attention</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-red-400 border-b border-red-500/30">
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Method</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Ref</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reconReport.discrepancies.map((d: any) => (
                    <tr key={d.id} className="border-b border-red-500/10">
                      <td className="py-2">{d.order}</td>
                      <td className="py-2">{d.method}</td>
                      <td className="py-2 text-right">{formatKES(d.amount)}</td>
                      <td className="py-2"><span className={`px-2 py-0.5 text-xs rounded ${d.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{d.status}</span></td>
                      <td className="py-2 text-[#787a73]">{d.externalRef || '-'}</td>
                      <td className="py-2 text-[#787a73]">{formatTime(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="border border-white/[0.08] bg-[#181a17] p-4">
          <h3 className="font-semibold mb-3">Shifts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                  <th className="pb-2">Staff</th>
                  <th className="pb-2">Opened</th>
                  <th className="pb-2">Closed</th>
                  <th className="pb-2 text-right">Opening</th>
                  <th className="pb-2 text-right">Closing</th>
                  <th className="pb-2 text-right">Expected</th>
                </tr>
              </thead>
              <tbody>
                {reconReport.shifts.map((s: any) => (
                  <tr key={s.id} className="border-b border-white/[0.03]">
                    <td className="py-2">{s.user}</td>
                    <td className="py-2">{formatTime(s.opensAt)}</td>
                    <td className="py-2">{s.closesAt ? formatTime(s.closesAt) : '<span className="text-yellow-400">Open</span>'}</td>
                    <td className="py-2 text-right">{formatKES(s.openingCash)}</td>
                    <td className="py-2 text-right">{s.closingCash ? formatKES(s.closingCash) : '-'}</td>
                    <td className="py-2 text-right">{formatKES(s.expectedCash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 size={22} className="text-[#d8a85b]" />
            Reports & Analytics
          </h2>
          <p className="text-sm text-[#878981]">Business intelligence and exports</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
          />
          <button
            onClick={() => window.open(`/api/reports/${activeTab}?date=${reportDate}`, '_blank')}
            className="flex items-center gap-2 rounded-md border border-white/[0.1] bg-[#181a17] px-4 py-2.5 text-xs font-medium text-[#a4a59e] hover:border-[#d8a85b]/50 transition"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
      <div className="flex gap-1 border-b border-white/[0.08]">
        {[
          { id: 'daily', label: 'Daily Summary', icon: CalendarDays },
          { id: 'products', label: 'Product Performance', icon: Package },
          { id: 'reconciliation', label: 'Reconciliation', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? 'text-[#d8a85b] border-b-2 border-[#d8a85b]'
                : 'text-[#787a73] hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-8 text-[#777971]">Loading report...</div>
      ) : (
        activeTab === 'daily' ? renderDaily() : activeTab === 'products' ? renderProducts() : renderReconciliation()
      )}
    </div>
  )
}

function StaffView({ data }: { data: DashboardData }) {
  const [staffList, setStaffList] = useState<any[]>([])
  const [roleGrants, setRoleGrants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'CASHIER' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [grantLoading, setGrantLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffRes, grantsRes] = await Promise.all([
          fetch('/api/staff'),
          fetch('/api/role-grants'),
        ])
        if (staffRes.ok) {
          const d = await staffRes.json()
          setStaffList(d.staff)
        }
        if (grantsRes.ok) {
          const d = await grantsRes.json()
          setRoleGrants(d.grants)
        }
      } catch (e) {
        console.error('Failed to load staff:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to invite')
      setShowInviteModal(false)
      setInviteForm({ email: '', name: '', role: 'CASHIER' })
      const staffRes = await fetch('/api/staff')
      if (staffRes.ok) {
        const d = await staffRes.json()
        setStaffList(d.staff)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite staff')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleGrantRole = async (userId: string, role: string) => {
    setGrantLoading(userId)
    try {
      const res = await fetch('/api/role-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: role as any }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to grant role')
      const grantsRes = await fetch('/api/role-grants')
      if (grantsRes.ok) {
        const d = await grantsRes.json()
        setRoleGrants(d.grants)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to grant role')
    } finally {
      setGrantLoading(null)
    }
  }

  const handleRevokeGrant = async (grantId: string) => {
    try {
      const res = await fetch(`/api/role-grants?id=${grantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke')
      setRoleGrants(roleGrants.filter((g) => g.id !== grantId))
    } catch (err) {
      alert('Failed to revoke role grant')
    }
  }

  const roleOptions = ['CASHIER', 'BARTENDER', 'WAITER', 'INVENTORY_MANAGER', 'MANAGER', 'ADMIN']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <UserCog size={22} className="text-[#d8a85b]" />
            Staff Management
          </h2>
          <p className="text-sm text-[#878981]">Team members, roles, and schedules</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"
        >
          <UserPlus size={15} />
          Invite Staff
        </button>
      </div>

      <div className="border border-white/[0.08] bg-[#181a17] overflow-hidden">
        <div className="grid grid-cols-7 gap-3 px-4 py-3 border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-[0.1em] text-[#787a73]">
          <div>Name</div>
          <div>Email</div>
          <div>Primary Role</div>
          <div>Additional Roles</div>
          <div>Status</div>
          <div>Shifts</div>
          <div></div>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-[#777971]">Loading staff...</div>
        ) : (
          staffList.map((staff) => (
            <div key={staff.id} className="grid grid-cols-7 gap-3 px-4 py-3 border-b border-white/[0.03] items-center">
              <div className="font-medium">{staff.name}</div>
              <div className="text-[#787a73] text-sm">{staff.email}</div>
              <div>
                <span className="px-2 py-0.5 text-xs rounded bg-white/[0.05]">{staff.role}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {staff.roles.filter((r: string) => r !== staff.role).map((r: string) => (
                  <span key={r} className="px-2 py-0.5 text-xs rounded bg-[#d8a85b]/20 text-[#d8a85b]">{r}</span>
                ))}
              </div>
              <div>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  staff.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {staff.status}
                </span>
              </div>
              <div className="text-sm text-[#787a73]">{staff.shiftCount} {staff.hasOpenShift && <span className="text-green-400 ml-1">●</span>}</div>
              <div className="flex items-center justify-end gap-2">
                {staff.roles.filter((r: string) => r !== staff.role).map((r: string) => (
                  <button
                    key={`${staff.id}-${r}`}
                    onClick={() => handleRevokeGrant(roleGrants.find(g => g.userId === staff.id && g.role === r)?.id)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                    title={`Revoke ${r}`}
                  >
                    <Trash2 size={12} />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border border-white/[0.08] bg-[#181a17] p-4">
        <h3 className="font-semibold mb-3">Grant Additional Role</h3>
        <div className="flex flex-wrap gap-3">
          {staffList.map((staff) => roleOptions
            .filter(r => !staff.roles.includes(r))
            .map((role) => (
              <button
                key={`${staff.id}-${role}`}
                onClick={() => handleGrantRole(staff.id, role)}
                disabled={grantLoading === staff.id}
                className="px-3 py-1.5 text-xs rounded border border-white/[0.1] bg-[#181a17] text-[#a4a59e] hover:border-[#d8a85b]/50 hover:text-[#d8a85b] transition disabled:opacity-50"
              >
                +{role} → {staff.name}
              </button>
            ))
          )}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#181a17] border border-white/[0.08] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Staff Member</h3>
            <form onSubmit={handleInvite}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Name</label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    required
                    className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                    className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Primary Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm border border-white/[0.1] hover:border-white/[0.3] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50"
                >
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/[0.06] rounded ${className}`} />
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#111210] p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-white/[0.08] bg-[#181a17] p-5">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      {/* Tables & Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tables */}
        <div className="border border-white/[0.08] bg-[#181a17] p-5">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#111210] rounded">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
        {/* Recent orders */}
        <div className="border border-white/[0.08] bg-[#181a17] p-5">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#111210] rounded">
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Low stock */}
      <div className="border border-white/[0.08] bg-[#181a17] p-5">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#111210] rounded">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-[#878981]">Account and app preferences</p>
      </div>
      <div className="border border-white/[0.08] bg-[#181a17] p-5">
        <p className="text-xs text-[#777971]">Settings panel coming soon</p>
      </div>
    </div>
  )
}

type OrderDetail = {
  id: string
  number: number
  status: string
  total: string
  tableId: string | null
  table: { id: string; name: string; status: string } | null
  items: Array<{
    id: string
    quantity: string
    unitPrice: string
    subtotal: string
    product: {
      id: string
      name: string
      price: string
      category: { name: string }
    }
  }>
  payments: Array<{
    id: string
    method: string
    status: string
    amount: string
    createdAt: string
  }>
  outstanding: string
  paidAmount: string
  createdAt: string
  createdBy: { name: string; email: string }
  statusHistory: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    changedBy: string
    createdAt: string
  }>
}

function OrderDetailModal({ order, onClose, onRefresh }: { order: OrderDetail | null; onClose: () => void; onRefresh: () => void }) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const handlePayment = async (method: 'CASH' | 'CARD' | 'PESAPAL') => {
    if (!order) return
    const amount = paymentAmount || order.outstanding
    setProcessing(method)
    try {
      const response = await fetch(`/api/orders/${order.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, amount }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment failed')
      }
      onRefresh()
      setPaymentAmount('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setProcessing(null)
    }
  }

  const handleStatusChange = async (status: 'VOID' | 'REFUNDED') => {
    if (!order || !confirm(`Are you sure you want to ${status.toLowerCase()} this order?`)) return
    setProcessing(status)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update order')
      }
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setProcessing(null)
    }
  }

  if (!order) return null

  const canVoid = order.status === 'OPEN'
  const canRefund = order.status === 'PAID'
  const hasOutstanding = parseFloat(order.outstanding) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4 bg-[#171815] z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Order Details</p>
            <h2 className="mt-1 text-lg font-semibold">Tab #{order.number} · {formatPrice(order.total)}</h2>
          </div>
          <button onClick={onClose} className="text-[#8c8e86] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#787a73]">Status</p>
              <p className="mt-1 text-sm font-semibold capitalize">{order.status.toLowerCase()}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#787a73]">Table</p>
              <p className="mt-1 text-sm font-semibold">{order.table?.name ?? 'Walk-in'}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#787a73]">Server</p>
              <p className="mt-1 text-sm font-semibold">{order.createdBy.name}</p>
            </div>
          </div>

          <div className="border border-white/[0.08] bg-[#181a17]">
            <div className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-[0.1em] text-[#787a73]">
              <div>Item</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Price</div>
              <div className="text-right">Total</div>
              <div></div>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="grid grid-cols-5 gap-3 px-4 py-3 border-t border-white/[0.04] items-center">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.product.name}</p>
                  <p className="text-[10px] text-[#777971]">{item.product.category.name}</p>
                </div>
                <p className="text-right text-xs">{item.quantity}</p>
                <p className="text-right text-xs text-[#777971]">{formatPrice(item.unitPrice)}</p>
                <p className="text-right text-xs font-medium">{formatPrice(item.subtotal)}</p>
                <div></div>
              </div>
            ))}
            <div className="px-4 py-3 border-t border-white/[0.06] flex justify-end gap-8">
              <div className="text-right">
                <p className="text-[10px] text-[#777971]">Subtotal</p>
                <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Payments</h3>
              {hasOutstanding && (
                <div className="flex items-center gap-2 text-[10px] text-[#d8a85b]">
                  Outstanding: <span className="font-semibold">{formatPrice(order.outstanding)}</span>
                </div>
              )}
            </div>
            <div className="border border-white/[0.08] bg-[#181a17]">
              {order.payments.length === 0 ? (
                <p className="px-4 py-4 text-center text-xs text-[#777971]">No payments yet</p>
              ) : (
                order.payments.map((payment, i) => (
                  <div key={payment.id} className={`flex items-center justify-between px-4 py-3 ${i ? 'border-t border-white/[0.04]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-[#2a2d27] text-[10px] text-[#b1b1a8]">
                        {payment.method === 'PESAPAL' ? 'MP' : payment.method === 'CARD' ? 'CD' : 'CS'}
                      </div>
                      <div>
                        <p className="text-xs font-medium capitalize">{payment.method.toLowerCase()}</p>
                        <p className="text-[10px] text-[#777971]">{formatTime(payment.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-medium text-right min-w-[80px]">{formatPrice(payment.amount)}</p>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                        payment.status === 'COMPLETED' ? 'bg-[#7cc58f]/20 text-[#7cc58f]' :
                        payment.status === 'PENDING' ? 'bg-[#d8a85b]/20 text-[#d8a85b]' :
                        'bg-[#dc8c72]/20 text-[#dc8c72]'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {hasOutstanding && (
                <div className="border-t border-white/[0.06] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs text-[#777971]">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={parseFloat(order.outstanding)}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={order.outstanding}
                      className="flex-1 max-w-[150px] h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={processing === 'CASH' || !hasOutstanding}
                      onClick={() => handlePayment('CASH')}
                      className="flex-1 rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === 'CASH' ? 'Processing...' : 'Cash'}
                    </button>
                    <button
                      disabled={processing === 'CARD' || !hasOutstanding}
                      onClick={() => handlePayment('CARD')}
                      className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === 'CARD' ? 'Processing...' : 'Card'}
                    </button>
                    <button
                      disabled={processing === 'PESAPAL' || !hasOutstanding}
                      onClick={() => handlePayment('PESAPAL')}
                      className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === 'PESAPAL' ? 'Processing...' : 'M-Pesa'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(canVoid || canRefund) && (
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <h3 className="mb-3 text-sm font-semibold">Actions</h3>
              <div className="flex gap-2">
                {canVoid && (
                  <button
                    disabled={processing === 'VOID'}
                    onClick={() => handleStatusChange('VOID')}
                    className="flex-1 rounded-md border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === 'VOID' ? 'Voiding...' : 'Void Order'}
                  </button>
                )}
                {canRefund && (
                  <button
                    disabled={processing === 'REFUNDED'}
                    onClick={() => handleStatusChange('REFUNDED')}
                    className="flex-1 rounded-md border border-[#d8a85b]/30 bg-[#d8a85b]/10 py-2.5 text-xs font-semibold text-[#d8a85b] hover:bg-[#d8a85b]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === 'REFUNDED' ? 'Refunding...' : 'Refund Order'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="mb-3 text-sm font-semibold">Status History</h3>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#777971]">{h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}</span>
                  <span className="text-[#777971]">{formatTime(h.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShiftModal({
  shift,
  show,
  onClose,
  onOpen,
  onCloseShift,
  openingCash,
  setOpeningCash,
  closingCash,
  setClosingCash,
  processing,
}: {
  shift: { id: string; startsAt: string; openingCash: string; cashDrawer: { balance: string } | null; cashTransactions: Array<{ type: string; amount: string; reason: string; createdAt: string }> } | null
  show: boolean
  onClose: () => void
  onOpen: () => void
  onCloseShift: () => void
  openingCash: string
  setOpeningCash: (value: string) => void
  closingCash: string
  setClosingCash: (value: string) => void
  processing: boolean
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Shift Management</p>
            <h2 className="mt-1 text-lg font-semibold">{shift ? 'Close Shift' : 'Open New Shift'}</h2>
          </div>
          <button onClick={onClose} className="text-[#8c8e86] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {shift ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-white/[0.08] bg-[#181a17] p-4">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#787a73]">Opened</p>
                  <p className="mt-1 text-sm font-semibold">{formatTime(shift.startsAt)}</p>
                </div>
                <div className="border border-white/[0.08] bg-[#181a17] p-4">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#787a73]">Opening Float</p>
                  <p className="mt-1 text-sm font-semibold">{formatPrice(shift.openingCash)}</p>
                </div>
                <div className="border border-white/[0.08] bg-[#181a17] p-4">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#787a73]">Current Cash</p>
                  <p className="mt-1 text-sm font-semibold">{formatPrice(shift.cashDrawer?.balance ?? '0')}</p>
                </div>
                <div className="border border-white/[0.08] bg-[#181a17] p-4">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#787a73]">Transactions</p>
                  <p className="mt-1 text-sm font-semibold">{shift.cashTransactions.length}</p>
                </div>
              </div>

              <div className="border border-white/[0.08] bg-[#181a17] p-4">
                <h3 className="mb-3 text-sm font-semibold">Close Shift</h3>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-[#777971] mb-1">Actual Cash Count (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="Enter counted cash"
                    className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                  />
                </div>
                <button
                  onClick={onCloseShift}
                  disabled={processing || !closingCash}
                  className="w-full rounded-md border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Closing...' : 'Close Shift'}
                </button>
              </div>

              <div className="border border-white/[0.08] bg-[#181a17] p-4">
                <h3 className="mb-3 text-sm font-semibold">Recent Transactions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {shift.cashTransactions.slice(0, 10).map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-semibold ${
                          ['SALE', 'TIP_IN'].includes(t.type) ? 'bg-[#7cc58f]/20 text-[#7cc58f]' :
                          ['REFUND', 'PAYOUT', 'TIP_OUT'].includes(t.type) ? 'bg-red-500/20 text-red-400' :
                          'bg-[#d8a85b]/20 text-[#d8a85b]'
                        }`}>
                          {t.type}
                        </span>
                        <span className="text-[#777971]">{t.reason}</span>
                      </div>
                      <span className={`font-medium ${['SALE', 'TIP_IN'].includes(t.type) ? 'text-[#7cc58f]' : 'text-red-400'}`}>
                        {['SALE', 'TIP_IN'].includes(t.type) ? '+' : '-'}{formatPrice(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="border border-white/[0.08] bg-[#181a17] p-4">
                <h3 className="mb-3 text-sm font-semibold">Opening Float</h3>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-[#777971] mb-1">Starting Cash (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                    autoFocus
                  />
                </div>
                <button
                  onClick={onOpen}
                  disabled={processing || !openingCash || parseFloat(openingCash) < 0}
                  className="w-full rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Opening...' : 'Open Shift'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [activeNav, setActiveNav] = useState('Overview')
  const [activeCategory, setActiveCategory] = useState('All items')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showSale, setShowSale] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [shift, setShift] = useState<{ id: string; startsAt: string; openingCash: string; cashDrawer: { balance: string } | null; cashTransactions: Array<{ type: string; amount: string; reason: string; createdAt: string }> } | null>(null)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [openingCash, setOpeningCash] = useState('0')
  const [closingCash, setClosingCash] = useState('')
  const [shiftProcessing, setShiftProcessing] = useState(false)

  async function fetchShift() {
    try {
      const response = await fetch('/api/shifts/current')
      if (response.ok) {
        const data = await response.json()
        setShift(data.shift)
      }
    } catch (err) {
      console.error('Failed to fetch shift:', err)
    }
  }

  async function fetchOrderDetail(orderId: string) {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      const order = await response.json()
      setSelectedOrder(order)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load order')
    }
  }

  function closeOrderDetail() {
    setSelectedOrder(null)
  }

  function refreshDashboard() {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
    if (selectedOrder) {
      fetchOrderDetail(selectedOrder.id)
    }
    fetchShift()
  }

  async function openShift() {
    if (!openingCash) return
    setShiftProcessing(true)
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingCash }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to open shift')
      }
      const newShift = await response.json()
      setShift(newShift)
      setShowShiftModal(false)
      setOpeningCash('0')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open shift')
    } finally {
      setShiftProcessing(false)
    }
  }

  async function closeShift() {
    if (!shift || !closingCash) return
    setShiftProcessing(true)
    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingCash }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to close shift')
      }
      const closedShift = await response.json()
      setShift(closedShift.status === 'CLOSED' ? null : closedShift)
      setShowShiftModal(false)
      setClosingCash('')
      refreshDashboard()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to close shift')
    } finally {
      setShiftProcessing(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, prodRes, shiftRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/products'),
          fetch('/api/shifts/current'),
        ])
        if (!dashRes.ok || !prodRes.ok) throw new Error('Failed to fetch')
        const [dashData, prodData, shiftData] = await Promise.all([
          dashRes.json(),
          prodRes.json(),
          shiftRes.json(),
        ])
        setData(dashData)
        setProducts(prodData)
        if (shiftData.shift) setShift(shiftData.shift)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category.name)))
    return ['All items', ...cats]
  }, [products])

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (activeCategory === 'All items' || product.category.name === activeCategory) &&
          product.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, activeCategory, query],
  )

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)

  function addToCart(product: Product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id)
      return found
        ? current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...current, { ...product, quantity: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.id !== productId))
  }

  async function handleCheckout() {
    if (cart.length === 0) return

    const items = cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }))

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create order')
      }

      setCart([])
      setShowSale(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      alert(message)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#111210] flex items-center justify-center">
        <div className="text-[#dc8c72]">Unable to load data. Please try again.</div>
      </div>
    )
  }

  const isAdmin = data.staff.roles.includes('ADMIN')
  const userRoles = data.staff.roles
  const allNavItems = [
    ...navItems.filter((item) => item.roles.some((r) => userRoles.includes(r))),
    ...adminNavItems.filter((item) => item.roles.some((r) => userRoles.includes(r))),
  ]

  const renderView = () => {
    switch (activeNav) {
      case 'Overview':
        return <OverviewView data={data} onOrderClick={fetchOrderDetail} />
      case 'Point of Sale':
        return (
          <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#d8a85b]">Point of sale</p>
                <h2 className="text-3xl font-semibold tracking-[-0.03em]">Create new tab</h2>
                <p className="mt-2 text-sm text-[#878981]">Add products to the cart and send to a table</p>
              </div>
            </div>
            <POSView
              products={products}
              categories={categories}
              activeCategory={activeCategory}
              query={query}
              filteredProducts={filteredProducts}
              cart={cart}
              onCategoryChange={setActiveCategory}
              onQueryChange={setQuery}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              cartTotal={cartTotal}
              onCheckout={handleCheckout}
              showSale={showSale}
              setShowSale={setShowSale}
            />
          </>
        )
      case 'Orders':
        return <OrdersView data={data} onOrderClick={fetchOrderDetail} />
      case 'Floor & Pool':
        return <FloorView data={data} onRefresh={refreshDashboard} />
      case 'Inventory':
        return <InventoryView data={data} onRefresh={refreshDashboard} />
      case 'Customers':
        return <CustomersView data={data} />
      case 'Admin':
        return <AdminView data={data} />
      case 'Reports':
        return <ReportsView data={data} />
      case 'Staff':
        return <StaffView data={data} />
      case 'Settings':
        return <SettingsView />
      default:
        return <OverviewView data={data} onOrderClick={fetchOrderDetail} />
    }
  }

  return (
    <main className="min-h-screen bg-[#111210] text-[#f3f0e9]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[228px] flex-col border-r border-white/[0.07] bg-[#171815] lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.07] px-6">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#d8a85b] text-[#171815]">
            <Spade size={19} fill="currentColor" />
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-[0.2em]">SINGAPORE</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.23em] text-[#898a82]">Club operations</p>
          </div>
        </div>
        <div className="px-3 pt-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71736c]">Workspace</p>
          <nav className="flex flex-col gap-1">
            {allNavItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveNav(label)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                  activeNav === label
                    ? 'bg-[#d8a85b]/12 font-medium text-[#e5ba72]'
                    : 'text-[#a4a59e] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon size={17} strokeWidth={1.7} />
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/[0.07] p-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#a4a59e] hover:bg-white/[0.04]">
            <Settings size={17} />
            Settings
          </button>
          <div className="mt-4 flex items-center gap-3 border-t border-white/[0.07] pt-4">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#8a6655] text-xs font-semibold">
              {getInitials(data.staff.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{data.staff.name}</p>
              <p className="text-[10px] text-[#777971]">{roleLabels[data.staff.role] ?? data.staff.role}</p>
            </div>
            <ChevronDown className="ml-auto text-[#777971]" size={14} />
          </div>
        </div>
      </aside>

      <section className="lg:pl-[228px]">
        <header className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button className="text-[#92948c] lg:hidden">
              <Menu size={21} />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#73756f]">{formatDate()}</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">
                {getGreeting()}, {data.staff.name}
                <span className="text-[#d8a85b]"> / </span>
                <span className="text-[#96978f]">{activeNav}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {shift ? (
              <div className="hidden items-center gap-3 rounded-md border border-[#d8a85b]/30 bg-[#d8a85b]/10 px-3 py-2 text-xs text-[#d8a85b] sm:flex">
                <span className="size-1.5 rounded-full bg-[#7cc58f] shadow-[0_0_8px_#7cc58f]" />
                Shift open · {formatTime(shift.startsAt)} · Float: {formatPrice(shift.openingCash)} · Cash: {formatPrice(shift.cashDrawer?.balance ?? '0')}
                <button onClick={() => setShowShiftModal(true)} className="ml-2 px-2 py-1 rounded text-[10px] bg-[#d8a85b]/20 hover:bg-[#d8a85b]/30">
                  Manage
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowShiftModal(true)}
                className="hidden items-center gap-2 rounded-md border border-[#d8a85b]/30 bg-[#d8a85b]/10 px-3 py-2 text-xs text-[#d8a85b] hover:bg-[#d8a85b]/20 sm:flex"
              >
                <span className="size-1.5 rounded-full bg-[#d8a85b]" />
                Open Shift
              </button>
            )}
            <button className="relative rounded-md border border-white/[0.08] p-2 text-[#a5a69f] hover:bg-white/[0.05]">
              <Bell size={17} />
              {data.lowStock.length > 0 && (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#dc8c72]" />
              )}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
          {renderView()}
        </div>
        <OrderDetailModal order={selectedOrder} onClose={closeOrderDetail} onRefresh={refreshDashboard} />
        <ShiftModal
          shift={shift}
          show={showShiftModal}
          onClose={() => setShowShiftModal(false)}
          onOpen={openShift}
          onCloseShift={closeShift}
          openingCash={openingCash}
          setOpeningCash={setOpeningCash}
          closingCash={closingCash}
          setClosingCash={setClosingCash}
          processing={shiftProcessing}
        />
      </section>
    </main>
  )
}