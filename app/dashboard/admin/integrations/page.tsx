'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Printer, Wifi } from 'lucide-react'
import { formatTime, formatPrice } from '@/lib/utils'

type PesapalConfig = {
  consumerKey: string
  consumerSecret: string
  ipnUrl: string
  enabled: boolean
}

type Printer = { id: string; name: string; endpoint: string; active: boolean }

export default function IntegrationsPage() {
  const [pesapal, setPesapal] = useState<PesapalConfig>({
    consumerKey: '',
    consumerSecret: '',
    ipnUrl: '',
    enabled: false,
  })
  const [printers, setPrinters] = useState<Printer[]>([])
  const [health, setHealth] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pesapalSaving, setPesapalSaving] = useState(false)
  const [tester, setTester] = useState<{ id: string; name: string; status: string | null } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pesapalRes, printersRes, healthRes] = await Promise.all([
        fetch('/api/integrations/pesapal'),
        fetch('/api/settings/printers'),
        fetch('/api/integrations/health'),
      ])
      if (pesapalRes.ok) {
        const d = await pesapalRes.json()
        setPesapal(d.data.config)
      }
      if (printersRes.ok) {
        const d = await printersRes.json()
        setPrinters(d.data.printers)
      }
      if (healthRes.ok) {
        const d = await healthRes.json()
        setHealth(d.data.health)
      }
    } catch (e) {
      console.error('Failed to load integrations:', e)
    } finally {
      setLoading(false)
    }
  }

  const savePesapal = async (e: React.FormEvent) => {
    e.preventDefault()
    setPesapalSaving(true)
    try {
      const res = await fetch('/api/integrations/pesapal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pesapal),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      alert('Pesapal credentials saved')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setPesapalSaving(false)
    }
  }

  const testPrinter = async (id: string, name: string) => {
    setTester({ id, name, status: 'testing' })
    try {
      const res = await fetch(`/api/integrations/printers/${id}/test`, { method: 'POST' })
      const result = await res.json()
      setTester({ id, name, status: result.online ? 'online' : 'offline' })
    } catch {
      setTester({ id, name, status: 'error' })
    }
  }

  const getHealthStatus = (provider: string) => {
    const record = health.find((h) => h.provider === provider)
    if (!record) return { label: 'Unknown', color: 'text-[#777971]' }
    if (record.status === 'UP') return { label: 'Online', color: 'text-[#7cc58f]' }
    if (record.status === 'DEGRADED') return { label: 'Degraded', color: 'text-[#d8a85b]' }
    return { label: 'Down', color: 'text-red-400' }
  }

  const terminalStatus = getHealthStatus('CARD_TERMINAL')
  const pesapalHealth = getHealthStatus('PESAPAL')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl font-semibold mb-6">Integrations</h2>
        <div className="text-center py-8 text-[#777971]">Loading integrations...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Integrations</h2>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-[#d8a85b]" />
          Pesapal Integration
        </h3>
        <form onSubmit={savePesapal} className="space-y-4 max-w-xl">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-[#787a73] mb-1">Consumer Key</label>
              <input
                type="text"
                value={pesapal.consumerKey}
                onChange={(e) => setPesapal({ ...pesapal, consumerKey: e.target.value })}
                className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                placeholder="Pesapal consumer key"
              />
            </div>
            <div>
              <label className="block text-xs text-[#787a73] mb-1">Consumer Secret</label>
              <input
                type="password"
                value={pesapal.consumerSecret}
                onChange={(e) => setPesapal({ ...pesapal, consumerSecret: e.target.value })}
                className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                placeholder="Pesapal consumer secret"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#787a73] mb-1">IPN Callback URL</label>
            <input
              type="url"
              value={pesapal.ipnUrl}
              onChange={(e) => setPesapal({ ...pesapal, ipnUrl: e.target.value })}
              className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
              placeholder="https://yoursite.com/api/pesapal/ipn"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-[#787a73] cursor-pointer">
              <input
                type="checkbox"
                checked={pesapal.enabled}
                onChange={(e) => setPesapal({ ...pesapal, enabled: e.target.checked })}
                className="rounded border-white/[0.2] bg-[#181a17] text-[#d8a85b] focus:ring-[#d8a85b]"
              />
              Enable Pesapal
            </label>
            {pesapalHealth.label !== 'Unknown' && (
              <span className={`text-xs ${pesapalHealth.color}`}>{pesapalHealth.label}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={pesapalSaving}
            className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50"
          >
            {pesapalSaving ? 'Saving...' : 'Save Pesapal Credentials'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Printer size={16} className="text-[#d8a85b]" />
          Printer Management
        </h3>
        <div className="responsive-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Endpoint</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Test</th>
              </tr>
            </thead>
            <tbody>
              {printers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-[#777971]">
                    No printers configured. Add via System Settings.
                  </td>
                </tr>
              ) : (
                printers.map((p) => (
                  <tr key={p.id} className="border-t border-white/[0.03]">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 text-[#787a73] truncate max-w-[200px]">{p.endpoint}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        p.active ? 'bg-[#7cc58f]/20 text-[#7cc58f]' : 'text-[#777971]'
                      }`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {tester && tester.id === p.id ? (
                        tester.status === 'testing' ? (
                          <span className="text-xs text-[#787a73]">Testing...</span>
                        ) : (
                          <span className={`text-xs ${
                            tester.status === 'online' ? 'text-[#7cc58f]' : 'text-red-400'
                          }`}>
                            {tester.status}
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => testPrinter(p.id, p.name)}
                          className="text-xs text-[#d8a85b] hover:underline flex items-center gap-1"
                        >
                          Test
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Wifi size={16} className="text-[#d8a85b]" />
          Payment Terminal Status
        </h3>
        <div className="border border-white/[0.08] bg-[#181a17] rounded-lg">
          <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-[0.1em] text-[#787a73]">
            <div>Service</div>
            <div>Status</div>
            <div>Last Checked</div>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
              <span className="text-sm">Card Terminal</span>
              <span className={`text-xs ${terminalStatus.color} flex items-center gap-1`}>
                <span className="size-1.5 rounded-full bg-current" />
                {terminalStatus.label}
              </span>
              <span className="text-xs text-[#787a73]">
                {health.find((h) => h.provider === 'CARD_TERMINAL')?.checkedAt
                  ? formatTime(health.find((h) => h.provider === 'CARD_TERMINAL')!.checkedAt)
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Pesapal Gateway</span>
              <span className={`text-xs ${pesapalHealth.color} flex items-center gap-1`}>
                <span className="size-1.5 rounded-full bg-current" />
                {pesapalHealth.label}
              </span>
              <span className="text-xs text-[#787a73]">
                {health.find((h) => h.provider === 'PESAPAL')?.checkedAt
                  ? formatTime(health.find((h) => h.provider === 'PESAPAL')!.checkedAt)
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}