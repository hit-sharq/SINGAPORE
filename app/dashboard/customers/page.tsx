'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, User, X, Edit2, Trash2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  orderCount: number
  lastOrder: string | null
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const d = await res.json()
        setCustomers(d.data.customers ?? d.customers)
      }
    } catch (e) {
      console.error('Failed to load customers:', e)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingCustomer(null)
    setForm({ name: '', phone: '', email: '', notes: '' })
    setShowModal(true)
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', notes: customer.notes || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      setShowModal(false)
      fetchCustomers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save customer')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchCustomers()
    } catch (err) {
      alert('Failed to delete customer')
    }
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-[#878981]">Customer management and history</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]">
          <Plus size={15} />
          Add Customer
        </button>
      </div>

      <div className="border border-white/[0.08] bg-[#181a17] overflow-hidden">
        <div className="grid grid-cols-7 gap-3 px-4 py-3 border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-[0.1em] text-[#787a73]">
          <div>Name</div>
          <div>Phone</div>
          <div>Email</div>
          <div>Orders</div>
          <div>Last Order</div>
          <div>Created</div>
          <div></div>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-[#777971]">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#777971]">No customers yet. Add your first customer.</div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="grid grid-cols-7 gap-3 px-4 py-3 border-b border-white/[0.03] items-center">
              <div className="font-medium">{c.name}</div>
              <div className="text-[#787a73] text-sm">{c.phone || '—'}</div>
              <div className="text-[#787a73] text-sm">{c.email || '—'}</div>
              <div className="text-sm">{c.orderCount}</div>
              <div className="text-[#787a73] text-sm">{c.lastOrder ? formatTime(c.lastOrder) : '—'}</div>
              <div className="text-[#787a73] text-sm">{formatTime(c.createdAt)}</div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openEditModal(c)} className="text-[#d8a85b] hover:underline text-xs">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:underline text-xs">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#181a17] border border-white/[0.08] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" placeholder="+254 7XX XXX XXX" />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-white/[0.1] hover:border-white/[0.3] transition">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50">{formLoading ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}