'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coffee,
  CreditCard,
  LayoutDashboard,
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
} from 'lucide-react'

type Product = { name: string; category: string; price: number; tone: string }
type CartItem = Product & { quantity: number }

const products: Product[] = [
  { name: 'Tusker Lager', category: 'Beer', price: 350, tone: 'beer' },
  { name: 'Gordon\'s Gin & Tonic', category: 'Cocktails', price: 850, tone: 'cocktail' },
  { name: 'Jameson Whiskey', category: 'Spirits', price: 700, tone: 'spirit' },
  { name: 'Passion Fruit Martini', category: 'Cocktails', price: 950, tone: 'martini' },
  { name: 'Chicken Wings', category: 'Food', price: 900, tone: 'food' },
  { name: 'Beef Samosas', category: 'Snacks', price: 450, tone: 'snack' },
  { name: 'Soda Water', category: 'Soft Drinks', price: 200, tone: 'soda' },
  { name: 'House Red Wine', category: 'Wine', price: 650, tone: 'wine' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Point of Sale', icon: ShoppingBag },
  { label: 'Orders', icon: CircleDollarSign, badge: '12' },
  { label: 'Floor & Pool', icon: Table2 },
  { label: 'Inventory', icon: Package },
  { label: 'Customers', icon: Users },
]

const tables = [
  { label: 'TABLE 01', status: 'AVAILABLE', detail: 'Ready for a new session' },
  { label: 'TABLE 02', status: 'OCCUPIED', detail: '01:35:20 · KES 500', guest: 'Tab #1048' },
  { label: 'TABLE 03', status: 'RESERVED', detail: '8:00 PM – 10:00 PM', guest: 'M. Kamau' },
  { label: 'TABLE 04', status: 'AVAILABLE', detail: 'Ready for a new session' },
]

function formatPrice(value: number) {
  return `KES ${value.toLocaleString()}`
}

export default function Page() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [activeCategory, setActiveCategory] = useState('All items')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([
    { ...products[0], quantity: 2 },
    { ...products[3], quantity: 1 },
    { ...products[4], quantity: 1 },
  ])
  const [showSale, setShowSale] = useState(false)

  const categories = ['All items', 'Beer', 'Cocktails', 'Spirits', 'Food', 'Snacks']
  const filteredProducts = useMemo(() => products.filter((product) =>
    (activeCategory === 'All items' || product.category === activeCategory) &&
    product.name.toLowerCase().includes(query.toLowerCase())
  ), [activeCategory, query])
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function addToCart(product: Product) {
    setCart((current) => {
      const found = current.find((item) => item.name === product.name)
      return found ? current.map((item) => item.name === product.name ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]
    })
  }

  return (
    <main className="min-h-screen bg-[#111210] text-[#f3f0e9]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[228px] flex-col border-r border-white/[0.07] bg-[#171815] lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.07] px-6">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#d8a85b] text-[#171815]"><Spade size={19} fill="currentColor" /></div>
          <div><p className="text-[15px] font-semibold tracking-[0.2em]">SINGAPORE</p><p className="mt-0.5 text-[9px] uppercase tracking-[0.23em] text-[#898a82]">Club operations</p></div>
        </div>
        <div className="px-3 pt-7"><p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71736c]">Workspace</p><nav className="flex flex-col gap-1">{navItems.map(({ label, icon: Icon, badge }) => <button key={label} onClick={() => setActiveNav(label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${activeNav === label ? 'bg-[#d8a85b]/12 font-medium text-[#e5ba72]' : 'text-[#a4a59e] hover:bg-white/[0.04] hover:text-white'}`}><Icon size={17} strokeWidth={1.7} />{label}{badge && <span className="ml-auto rounded-full bg-[#c86e57]/15 px-1.5 py-0.5 text-[10px] text-[#dc8c72]">{badge}</span>}</button>)}</nav></div>
        <div className="mt-auto border-t border-white/[0.07] p-4"><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#a4a59e] hover:bg-white/[0.04]"><Settings size={17} />Settings</button><div className="mt-4 flex items-center gap-3 border-t border-white/[0.07] pt-4"><div className="flex size-8 items-center justify-center rounded-full bg-[#8a6655] text-xs font-semibold">AK</div><div className="min-w-0"><p className="truncate text-xs font-medium">Alex K.</p><p className="text-[10px] text-[#777971]">General Manager</p></div><ChevronDown className="ml-auto text-[#777971]" size={14} /></div></div>
      </aside>

      <section className="lg:pl-[228px]">
        <header className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8"><div className="flex items-center gap-3"><button className="text-[#92948c] lg:hidden"><Menu size={21} /></button><div><p className="text-[11px] uppercase tracking-[0.16em] text-[#73756f]">Tuesday, 24 September 2026</p><h1 className="mt-1 text-xl font-semibold tracking-tight">Good evening, Alex <span className="text-[#d8a85b]">/</span> <span className="text-[#96978f]">{activeNav}</span></h1></div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-[#a5a69f] sm:flex"><span className="size-1.5 rounded-full bg-[#7cc58f] shadow-[0_0_8px_#7cc58f]" />Shift live · 18:42</div><button className="relative rounded-md border border-white/[0.08] p-2 text-[#a5a69f] hover:bg-white/[0.05]"><Bell size={17} /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#d8a85b]" /></button></div></header>

        <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#d8a85b]">Live operations</p><h2 className="text-3xl font-semibold tracking-[-0.03em]">Tonight at Singapore</h2><p className="mt-2 text-sm text-[#878981]">Your club at a glance. Everything is looking good.</p></div><div className="flex gap-2"><button onClick={() => setShowSale(true)} className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"><Plus size={15} /> New sale</button><button className="flex items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-[#d0d0c9] hover:bg-white/[0.06]"><CalendarDays size={15} /> Today</button></div></div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">{[['Today’s revenue','KES 184,650','+12.8%',true],['Orders','148','+8.2%',true],['Active tabs','24','+3.1%',true],['Pool revenue','KES 42,300','+18.4%',true],['Bar revenue','KES 109,850','+10.2%',true],['Food revenue','KES 32,500','+6.5%',true],['Outstanding','KES 18,400','Needs attention',false]].map(([label,value,change,positive]) => <div key={label as string} className="border border-white/[0.08] bg-[#181a17] p-4"><p className="text-[10px] uppercase tracking-[0.11em] text-[#787a73]">{label}</p><p className="mt-3 text-lg font-semibold tracking-tight">{value}</p><p className={`mt-2 flex items-center gap-1 text-[10px] ${positive ? 'text-[#7cc58f]' : 'text-[#d8a85b]'}`}>{positive ? <ArrowUpRight size={12} /> : <Clock3 size={12} />}{change}</p></div>)}</div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_350px]">
            <div className="min-w-0"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold">Revenue overview</h3><p className="mt-1 text-xs text-[#777971]">Hourly performance · Tuesday, 24 September</p></div><button className="flex items-center gap-1.5 text-xs text-[#a5a69f]">This week <ChevronDown size={13} /></button></div><div className="border border-white/[0.08] bg-[#181a17] p-5"><div className="flex h-[190px] items-end gap-2 sm:gap-4">{[35,43,38,51,46,64,56,75,69,88,72,92,80,68,82,96,84,75].map((height, i) => <div key={i} className="group flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-sm transition-all group-hover:bg-[#e5b66b] ${i > 13 ? 'bg-[#d8a85b]' : 'bg-[#806e4e]'}`} style={{ height: `${height}%` }} /><span className="text-[9px] text-[#64665f]">{i % 3 === 0 ? `${12 + i}:00` : ''}</span></div>)}</div><div className="mt-5 flex items-center gap-5 border-t border-white/[0.07] pt-4 text-[10px] text-[#878981]"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#d8a85b]" />Revenue <b className="font-medium text-[#d0d0c9]">KES 184,650</b></span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#7cc58f]" />vs last Tuesday <b className="font-medium text-[#7cc58f]">+12.8%</b></span></div></div></div>
            <div><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold">Payment activity</h3><p className="mt-1 text-xs text-[#777971]">Today’s collection mix</p></div><MoreHorizontal size={17} className="text-[#777971]" /></div><div className="border border-white/[0.08] bg-[#181a17] p-5"><div className="flex items-center gap-5"><div className="relative flex size-[122px] shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#d8a85b 0 57%, #748b76 57% 82%, #6b6d68 82% 100%)' }}><div className="flex size-[88px] flex-col items-center justify-center rounded-full bg-[#181a17]"><span className="text-lg font-semibold">184.6k</span><span className="text-[9px] text-[#777971]">total KES</span></div></div><div className="flex flex-col gap-3 text-[11px] text-[#979991]"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#d8a85b]" />M-Pesa <b className="ml-2 text-[#d2d1c8]">57%</b></span><span><i className="mr-2 inline-block size-2 rounded-full bg-[#748b76]" />Card <b className="ml-2 text-[#d2d1c8]">25%</b></span><span><i className="mr-2 inline-block size-2 rounded-full bg-[#6b6d68]" />Cash <b className="ml-2 text-[#d2d1c8]">18%</b></span></div></div><div className="mt-5 flex justify-between border-t border-white/[0.07] pt-4 text-[10px] text-[#777971]"><span>Last payment <b className="ml-1 text-[#d2d1c8]">KES 4,500</b></span><span className="text-[#7cc58f]">Just now</span></div></div></div>
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold">Pool floor</h3><p className="mt-1 text-xs text-[#777971]">4 tables · 2 in play</p></div><button className="text-xs font-medium text-[#d8a85b]">Manage floor →</button></div><div className="grid grid-cols-2 gap-3">{tables.map((table) => <div key={table.label} className={`border p-4 ${table.status === 'OCCUPIED' ? 'border-[#d8a85b]/40 bg-[#211e17]' : 'border-white/[0.08] bg-[#181a17]'}`}><div className="flex items-start justify-between"><div className="flex size-9 items-center justify-center rounded-md bg-[#2d302a] text-[#b4b4aa]"><Table2 size={17} /></div><span className={`text-[9px] font-semibold tracking-[0.12em] ${table.status === 'OCCUPIED' ? 'text-[#d8a85b]' : table.status === 'RESERVED' ? 'text-[#d78d6f]' : 'text-[#7cc58f]'}`}>{table.status}</span></div><p className="mt-5 text-[11px] font-semibold tracking-[0.13em] text-[#d7d6ce]">{table.label}</p><p className="mt-1 text-xs text-[#777971]">{table.detail}</p>{table.guest && <p className="mt-3 text-[10px] text-[#d8a85b]">{table.guest}</p>}</div>)}</div></div>
            <div><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold">Recent orders</h3><p className="mt-1 text-xs text-[#777971]">Activity across the floor</p></div><button className="text-xs font-medium text-[#d8a85b]">View all →</button></div><div className="border border-white/[0.08] bg-[#181a17]">{[['#1048','Walk-in Guest','KES 2,250','Paid · M-Pesa','18:40'],['#1047','Sarah Wanjiku','KES 8,450','Open tab','18:35'],['#1046','Table 04 Guest','KES 1,800','Paid · Card','18:21'],['#1045','David Ochieng','KES 3,200','Paid · Cash','18:12']].map(([id,name,total,status,time], i) => <div key={id} className={`flex items-center gap-3 px-4 py-3.5 ${i ? 'border-t border-white/[0.06]' : ''}`}><div className="flex size-8 items-center justify-center rounded-full bg-[#2a2d27] text-[10px] text-[#b1b1a8]">{id.slice(1)}</div><div className="min-w-0 flex-1"><p className="text-xs font-medium">{name}</p><p className="mt-0.5 text-[10px] text-[#777971]">{id} · {time}</p></div><div className="text-right"><p className="text-xs font-medium">{total}</p><p className={`mt-0.5 text-[10px] ${status.startsWith('Open') ? 'text-[#d8a85b]' : 'text-[#7cc58f]'}`}>{status}</p></div></div>)}</div></div>
          </div>
        </div>
      </section>

      {showSale && <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-5xl border border-white/[0.1] bg-[#171815] shadow-2xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Point of sale</p><h2 className="mt-1 text-lg font-semibold">New customer tab</h2></div><button onClick={() => setShowSale(false)} className="text-[#8c8e86] hover:text-white"><X size={20} /></button></div><div className="grid lg:grid-cols-[1fr_310px]"><div className="p-5"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777971]" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." className="w-full border border-white/[0.1] bg-[#20221e] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" /></div><div className="my-4 flex gap-2 overflow-x-auto pb-1">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs ${activeCategory === category ? 'bg-[#d8a85b] font-semibold text-[#1b1914]' : 'bg-white/[0.04] text-[#a4a59e] hover:bg-white/[0.08]'}`}>{category}</button>)}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{filteredProducts.map((product) => <button key={product.name} onClick={() => addToCart(product)} className="border border-white/[0.08] bg-[#1d1f1b] p-3 text-left transition hover:border-[#d8a85b]/60 hover:bg-[#24241e]"><div className={`mb-5 flex size-9 items-center justify-center rounded-md text-[#d8a85b] ${product.tone === 'food' ? 'bg-[#6b4c35]/30' : 'bg-[#4e5143]'}`}>{product.category === 'Food' ? <Coffee size={17} /> : <Wine size={17} />}</div><p className="text-xs font-medium">{product.name}</p><p className="mt-1 text-xs text-[#d8a85b]">{formatPrice(product.price)}</p></button>)}</div></div><div className="border-t border-white/[0.08] bg-[#1b1d19] p-5 lg:border-l lg:border-t-0"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Open tab</p><h3 className="mt-1 text-base font-semibold">Tab #1049</h3></div><button className="text-xs text-[#9b9c94]">Walk-in Guest</button></div><div className="my-5 flex flex-col gap-3">{cart.map((item) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="flex size-5 items-center justify-center rounded bg-white/[0.07] text-[10px]">{item.quantity}</span><span className="min-w-0 flex-1 truncate text-[#c3c3bb]">{item.name}</span><span className="text-[#d0cfc7]">{formatPrice(item.price * item.quantity)}</span></div>)}</div><div className="border-t border-white/[0.08] pt-4"><div className="flex justify-between text-sm font-semibold"><span>Total</span><span className="text-[#d8a85b]">{formatPrice(cartTotal)}</span></div><button onClick={() => setShowSale(false)} className="mt-5 flex w-full items-center justify-center gap-2 bg-[#d8a85b] py-3 text-xs font-semibold text-[#1b1914] hover:bg-[#e4b96d]"><CreditCard size={15} /> Save open tab</button></div></div></div></div></div>}
    </main>
  )
}
