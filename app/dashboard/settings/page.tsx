'use client'

import { useEffect, useState } from 'react'
import { Settings, Percent, Tag, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatTime } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'venue' | 'tax' | 'discount' | 'printers'>('venue')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>({ taxRules: [], discountRules: [], printers: [] })

  const [venueName, setVenueName] = useState('Singapore Club')
  const [savingVenue, setSavingVenue] = useState(false)

  const [taxForm, setTaxForm] = useState({ name: '', rate: '', active: true })
  const [discountForm, setDiscountForm] = useState({ name: '', percentage: '', active: true })
  const [printerForm, setPrinterForm] = useState({ name: '', endpoint: '', active: true })

  const [taxSaving, setTaxSaving] = useState<string | null>(null)
  const [discountSaving, setDiscountSaving] = useState<string | null>(null)
  const [printerSaving, setPrinterSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const d = await res.json()
        setData(d.data)
        setVenueName(d.data.config?.venueName || 'Singapore Club')
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const saveVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingVenue(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueName }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      alert('Venue config saved')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingVenue(false)
    }
  }

  const saveTaxRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setTaxSaving('new')
    try {
      const res = await fetch('/api/settings/tax-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: taxForm.name, rate: parseFloat(taxForm.rate), active: taxForm.active }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      setTaxForm({ name: '', rate: '', active: true })
      fetchSettings()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create tax rule')
    } finally {
      setTaxSaving(null)
    }
  }

  const updateTaxRule = async (id: string, field: string, value: any) => {
    try {
      const res = await fetch(`/api/settings/tax-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchSettings()
    } catch (err) {
      alert('Failed to update tax rule')
    }
  }

  const deleteTaxRule = async (id: string) => {
    if (!confirm('Delete this tax rule?')) return
    try {
      const res = await fetch(`/api/settings/tax-rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchSettings()
    } catch (err) {
      alert('Failed to delete tax rule')
    }
  }

  const saveDiscountRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setDiscountSaving('new')
    try {
      const res = await fetch('/api/settings/discount-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: discountForm.name, percentage: parseFloat(discountForm.percentage), active: discountForm.active }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      setDiscountForm({ name: '', percentage: '', active: true })
      fetchSettings()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create discount rule')
    } finally {
      setDiscountSaving(null)
    }
  }

  const updateDiscountRule = async (id: string, field: string, value: any) => {
    try {
      const res = await fetch(`/api/settings/discount-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchSettings()
    } catch (err) {
      alert('Failed to update discount rule')
    }
  }

  const deleteDiscountRule = async (id: string) => {
    if (!confirm('Delete this discount rule?')) return
    try {
      const res = await fetch(`/api/settings/discount-rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchSettings()
    } catch (err) {
      alert('Failed to delete discount rule')
    }
  }

  const savePrinter = async (e: React.FormEvent) => {
    e.preventDefault()
    setPrinterSaving('new')
    try {
      const res = await fetch('/api/settings/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: printerForm.name, endpoint: printerForm.endpoint, active: printerForm.active }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      setPrinterForm({ name: '', endpoint: '', active: true })
      fetchSettings()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create printer')
    } finally {
      setPrinterSaving(null)
    }
  }

  const updatePrinter = async (id: string, field: string, value: any) => {
    try {
      const res = await fetch(`/api/settings/printers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchSettings()
    } catch (err) {
      alert('Failed to update printer')
    }
  }

  const deletePrinter = async (id: string) => {
    if (!confirm('Delete this printer?')) return
    try {
      const res = await fetch(`/api/settings/printers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchSettings()
    } catch (err) {
      alert('Failed to delete printer')
    }
  }

  const tabs = [
    { id: 'venue', label: 'Venue Config', icon: Settings },
    { id: 'tax', label: 'Tax Rules', icon: Percent },
    { id: 'discount', label: 'Discount Rules', icon: Tag },
    { id: 'printers', label: 'Printers', icon: Printer },
  ]

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-[#878981]">Venue configuration, tax rules, receipt templates</p>
        </div>
      </div>

      <div className="admin-tabs flex gap-1 border-b border-white/[0.08] overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
        {activeTab === 'venue' && (
          <form onSubmit={saveVenue} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs text-[#787a73] mb-1">Venue Name</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
              />
            </div>
            <button type="submit" disabled={savingVenue} className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50">
              {savingVenue ? 'Saving...' : 'Save Venue Config'}
            </button>
          </form>
        )}
        {activeTab === 'tax' && (
          <div className="space-y-6">
            <form onSubmit={saveTaxRule} className="border border-white/[0.08] bg-[#111210] p-4 rounded-lg space-y-3 max-w-md">
              <h3 className="font-semibold">Add Tax Rule</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Name</label>
                  <input type="text" value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} required className="w-full rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Rate (%)</label>
                  <input type="number" step="0.01" value={taxForm.rate} onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })} required className="w-full rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs text-[#787a73]">
                    <input type="checkbox" checked={taxForm.active} onChange={(e) => setTaxForm({ ...taxForm, active: e.target.checked })} className="rounded border-white/[0.2] bg-[#181a17] text-[#d8a85b] focus:ring-[#d8a85b]" /> Active
                  </label>
                </div>
              </div>
              <button type="submit" disabled={!!taxSaving} className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50">
                {taxSaving ? 'Adding...' : 'Add Tax Rule'}
              </button>
            </form>
            <div className="border border-white/[0.08] bg-[#181a17] p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Existing Tax Rules</h3>
              <div className="responsive-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                      <th className="pb-2">Name</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.taxRules.map((r: any) => (
                      <tr key={r.id} className="border-b border-white/[0.03]">
                        <td className="py-2">{r.name}</td>
                        <td className="py-2 text-right">{parseFloat(r.rate).toFixed(2)}%</td>
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={r.active}
                            onChange={(e) => updateTaxRule(r.id, 'active', e.target.checked)}
                            className="rounded border-white/[0.2] bg-[#181a17] text-[#d8a85b] focus:ring-[#d8a85b]"
                          />
                        </td>
                        <td className="py-2">
                          <button onClick={() => deleteTaxRule(r.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'discount' && (
          <div className="space-y-6">
            <form onSubmit={saveDiscountRule} className="border border-white/[0.08] bg-[#111210] p-4 rounded-lg space-y-3 max-w-md">
              <h3 className="font-semibold">Add Discount Rule</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Name</label>
                  <input type="text" value={discountForm.name} onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })} required className="w-full rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Percentage (%)</label>
                  <input type="number" step="0.01" value={discountForm.percentage} onChange={(e) => setDiscountForm({ ...discountForm, percentage: e.target.value })} required className="w-full rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs text-[#787a73]">
                    <input type="checkbox" checked={discountForm.active} onChange={(e) => setDiscountForm({ ...discountForm, active: e.target.checked })} className="rounded border-white/[0.2] bg-[#181a17] text-[#d8a85b] focus:ring-[#d8a85b]" /> Active
                  </label>
                </div>
              </div>
              <button type="submit" disabled={!!discountSaving} className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50">
                {discountSaving ? 'Adding...' : 'Add Discount Rule'}
              </button>
            </form>
            <div className="border border-white/[0.08] bg-[#181a17] p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Existing Discount Rules</h3>
              <div className="responsive-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                      <th className="pb-2">Name</th>
                      <th className="pb-2 text-right">Percentage</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.discountRules.map((r: any) => (
                      <tr key={r.id} className="border-b border-white/[0.03]">
                        <td className="py-2">{r.name}</td>
                        <td className="py-2 text-right">{parseFloat(r.percentage).toFixed(2)}%</td>
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={r.active}
                            onChange={(e) => updateDiscountRule(r.id, 'active', e.target.checked)}
                            className="rounded border-white/[0.2] bg-[#181a17] text-[#d8a85b] focus:ring-[#d8a85b]"
                          />
                        </td>
                        <td className="py-2">
                          <button onClick={() => deleteDiscountRule(r.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'printers' && (
          <div className="space-y-6">
            <form onSubmit={savePrinter} className="border border-white/[0.08] bg-[#111210] p-4 rounded-lg space-y-3 max-w-md">
              <h3 className="font-semibold">Add Printer</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Name</label>
                  <input type="text" value={printerForm.name} onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })} required className="w-full rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" placeholder="e.g. Kitchen Printer" />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Endpoint URL</label>
                  <input type="url" value={printerForm.endpoint} onChange={(e) => setPrinterForm({ ...printerForm, endpoint: e.target.value })} required className="w-full rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none" placeholder="http://printer.local/print" />
                </div>
                <label className="flex items-center gap-2 text-xs text-[#787a73]">
                  <input type="checkbox" checked={printerForm.active} onChange={(e) => setPrinterForm({ ...printerForm, active: e.target.checked })} className="rounded border-white/[0.2] bg-[#181a17] text-[#d8a85b] focus:ring-[#d8a85b]" /> Active
                </label>
              </div>
              <button type="submit" disabled={!!printerSaving} className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50">
                {printerSaving ? 'Adding...' : 'Add Printer'}
              </button>
            </form>
            <div className="border border-white/[0.08] bg-[#181a17] p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Configured Printers</h3>
              <div className="responsive-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Endpoint</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.printers.map((p: any) => (
                      <tr key={p.id} className="border-b border-white/[0.03]">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-[#787a73]">{p.endpoint}</td>
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={p.active}
                            onChange={(e) => updatePrinter(p.id, 'active', e.target.checked)}
                            className="rounded border-white/[0.2] bg-[#181a17] text-[#d8a85b] focus:ring-[#d8a85b]"
                          />
                        </td>
                        <td className="py-2">
                          <button onClick={() => deletePrinter(p.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}