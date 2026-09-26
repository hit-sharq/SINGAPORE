'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Coffee, Wine, ShoppingBag, Activity, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

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

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ])
        if (prodRes.ok) {
          const d = await prodRes.json()
          setProducts(d.data.products)
        }
        if (catRes.ok) {
          const d = await catRes.json()
          setCategories(d.data.categories ?? d.data)
        }
      } catch (e) {
        console.error('Failed to load POS data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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
      alert('Order sent!')
    } catch (e) {
      alert('Failed to create order')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
        <div className="text-center py-8 text-[#777971]">Loading POS...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Point of Sale</h1>
          <p className="text-sm text-[#878981]">Create new customer tab</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_310px] gap-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777971]" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full border border-white/[0.1] bg-[#20221e] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 max-h-[60vh] overflow-y-auto">
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

        <aside className="border border-white/[0.08] bg-[#181a17] rounded-lg p-5 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#787a73]">
              Tab · {cart.length} items
            </p>
            <Activity size={15} className="text-[#777971]" />
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center flex-1">
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
  )
}