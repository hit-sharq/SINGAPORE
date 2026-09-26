'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, X, Clock, CreditCard, Building2, User, Coffee, Wine, Activity, ShoppingBag } from 'lucide-react'
import { formatPrice, formatTime } from '@/lib/utils'

type Order = {
  id: string
  number: number
  total: string
  status: string
  paymentStatus: string
  createdAt: string
  table: { id: string; name: string } | null
  guest: { name: string } | null
  payments: { method: string; amount: string }[]
  items: { id: string; name: string; quantity: number; price: string }[]
}

type Product = {
  id: string
  name: string
  price: string
  category: { name: string }
}

type Category = { id: string; name: string }

type CartItem = {
  id: string
  name: string
  price: string
  quantity: number
}

const paymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    MPESA: 'M-Pesa',
    PESAPAL: 'Pesapal',
    COMP: 'Comp',
  }
  return labels[method] || method
}

const getOrderPaymentStatus = (order: Order) => {
  const paid = order.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const total = parseFloat(order.total)
  if (paid >= total) return { label: 'Paid', color: 'text-[#7cc58f]' }
  if (paid > 0) return { label: 'Partial', color: 'text-[#d8a85b]' }
  return { label: 'Unpaid', color: 'text-red-400' }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showSale, setShowSale] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersRes, prodRes, catRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/categories'),
      ])
      if (ordersRes.ok) {
        const d = await ordersRes.json()
        setOrders(d.data.orders)
      }
      if (prodRes.ok) {
        const d = await prodRes.json()
        setProducts(d.data.products)
      }
      if (catRes.ok) {
        const d = await catRes.json()
        setCategories(d.data.categories ?? d.data)
      }
    } catch (e) {
      console.error('Failed to load orders data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category.name === activeCategory
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  const allCategories = ['All', ...categories.map((c) => c.name)]

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, price: product.price, quantity: 1 }]
    })
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === productId)
      if (!item || item.quantity <= 1) {
        return prev.filter((i) => i.id !== productId)
      }
      return prev.map((i) => (i.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
    })
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, tableId: null }),
      })
      if (!res.ok) throw new Error('Failed to create order')
      setCart([])
      setShowSale(false)
      loadData()
      alert('Order created!')
    } catch (e) {
      alert('Failed to create order')
    }
  }

  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(orders.length / pageSize)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
        <div className="text-center py-8 text-[#777971]">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-[#878981]">All orders across the venue</p>
        </div>
        <button onClick={() => setShowSale(true)} className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]">
          <Plus size={15} />
          New Order
        </button>
      </div>

      {showSale && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowSale(false)}>
          <div className="w-full max-w-5xl max-h-[90vh] sm:max-h-[90vh] flex flex-col border border-white/[0.1] bg-[#171815] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Point of sale</p>
                <h2 className="mt-1 text-lg font-semibold">New customer tab</h2>
              </div>
              <button onClick={() => setShowSale(false)} className="text-[#8c8e86] hover:text-white p-2">
                <X size={20} />
              </button>
            </div>
            <div className="grid lg:grid-cols-[1fr_310px] max-h-[90vh] overflow-hidden">
              <div className="p-5 overflow-hidden flex flex-col">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777971]" size={16} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full border border-white/[0.1] bg-[#20221e] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                  />
                </div>
                <div className="my-4 flex gap-2 overflow-x-auto pb-1">
                  {allCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
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
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 max-h-[50vh] overflow-y-auto pb-4 pr-2">
                  {filteredProducts.length === 0 ? (
                    <p className="col-span-full text-xs text-[#777971]">No products found.</p>
                  ) : (
                    filteredProducts.map((product) => {
                      const tone = product.category.name.toLowerCase().includes('food') ? 'food' : 'drink'
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleAddToCart(product)}
                          className="border border-white/[0.08] bg-[#1d1f1b] p-3 text-left transition hover:border-[#d8a85b]/60 hover:bg-[#24241e] min-h-[44px]"
                        >
                          <div
                            className={`mb-3 flex size-9 items-center justify-center rounded-md text-[#d8a85b] ${
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

              <aside className="border-t border-white/[0.08] lg:border-l lg:border-t-0 lg:border-l-white/[0.08] p-5">
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
                  <>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 p-3 border border-white/[0.08] bg-[#1d1f1b] rounded-lg">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{item.name}</p>
                            <p className="text-[10px] text-[#777971]">
                              {item.quantity} × {formatPrice(item.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-[#777971] hover:text-[#dc8c72] p-1"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

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
                      onClick={handleCheckout}
                      className="mt-4 w-full rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send to table
                    </button>
                  </>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}

      <div className="border border-white/[0.08] bg-[#181a17]">
        {orders.length === 0 ? (
          <p className="px-4 py-3.5 text-xs text-[#777971]">No orders found.</p>
        ) : (
          <>
            {paginatedOrders.map((order, i) => {
              const status = getOrderPaymentStatus(order)
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
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
            })}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/[0.06]">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-[#777971] hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-[#777971]">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-[#777971] hover:text-white disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Order Details</p>
                <h2 className="mt-1 text-lg font-semibold">#{selectedOrder.number}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[#8c8e86] hover:text-white p-2">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 text-xs">
                  <span className="px-2 py-1 rounded bg-white/[0.05]">{selectedOrder.table ? selectedOrder.table.name : 'Walk-in'}</span>
                  <span className="px-2 py-1 rounded bg-white/[0.05]">{formatTime(selectedOrder.createdAt)}</span>
                  <span className="px-2 py-1 rounded bg-white/[0.05]">{selectedOrder.guest?.name || 'Guest'}</span>
                </div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-2 border-b border-white/[0.04]">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.06] font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
              <div className="border-t border-white/[0.08] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#787a73] mb-2">Payments</p>
                {selectedOrder.payments.length === 0 ? (
                  <p className="text-sm text-[#777971]">No payments recorded</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{paymentMethodLabel(p.method)}</span>
                        <span>{formatPrice(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}