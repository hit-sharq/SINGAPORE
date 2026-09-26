'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Coffee, Wine, Trash2, Edit2, Package, AlertTriangle, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type Product = {
  id: string
  name: string
  sku: string | null
  price: string
  costPrice: string | null
  stock: string
  reorderAt: string
  status: 'ACTIVE' | 'INACTIVE'
  category: { id: string; name: string }
}

type Category = { id: string; name: string }

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ])
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(prodData.data.products)
      }
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.data.categories ?? catData.data)
      }
    } catch (err) {
      console.error('Failed to load inventory:', err)
    } finally {
      setLoading(false)
    }
  }

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
      loadInventory()
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

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category.name === activeCategory
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
        <div className="text-center py-8 text-[#777971]">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
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

      <div className="space-y-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777971]" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-white/[0.1] bg-[#20221e] py-2 pl-10 pr-4 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', ...categories.map((c) => c.name)].map((category) => (
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
      </div>

      <div className="border border-white/[0.08] bg-[#181a17] overflow-hidden">
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
        {filteredProducts.length === 0 ? (
          <p className="px-4 py-8 text-center text-[#777971]">No products yet. Add your first product.</p>
        ) : (
          filteredProducts.map((product, i) => {
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
                        className="text-[9px] text-[#777971] hover:text-white"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(product.id, 1, 'Restock')}
                        className="text-[9px] text-[#d8a85b] hover:underline"
                      >
                        +Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="text-[9px] text-red-400 hover:underline"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </form>
            )
          })
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Add Product</p>
                <h2 className="mt-1 text-lg font-semibold">New product</h2>
              </div>
              <button onClick={() => setShowAddProduct(false)} className="text-[#8c8e86] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(new FormData(e.currentTarget)) }} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Name *</label>
                  <input name="name" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">SKU</label>
                  <input name="sku" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Category *</label>
                  <select name="categoryId" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Price (KES) *</label>
                  <input name="price" type="number" step="0.01" required className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Cost Price (KES)</label>
                  <input name="costPrice" type="number" step="0.01" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Initial Stock *</label>
                  <input name="stock" type="number" step="0.001" required defaultValue="0" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Reorder Point</label>
                  <input name="reorderAt" type="number" step="0.001" defaultValue="5" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#777971] mb-1">Status</label>
                  <select name="status" defaultValue="ACTIVE" className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]">Cancel</button>
                <button type="submit" disabled={saving === 'add'} className="flex-1 rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50">{saving === 'add' ? 'Saving...' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
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
                <label className="block text-xs font-medium text-[#777971] mb-1">Category Name *</label>
                <input
                  type="text"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(e.currentTarget.value); e.currentTarget.value = '' } }}
                  placeholder="e.g. Cocktails"
                  className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddCategory(false)} className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]">Cancel</button>
                <button disabled={saving === 'category'} className="flex-1 rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50">{saving === 'category' ? 'Adding...' : 'Create Category'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}