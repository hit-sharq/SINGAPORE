'use client'

import { useEffect, useState } from 'react'
import { Activity, ToggleRight, ToggleLeft, Trash2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type FeatureFlag = { key: string; enabled: boolean; updatedAt: string }

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [newKey, setNewKey] = useState('')
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feature-flags')
      if (res.ok) {
        const d = await res.json()
        setFlags(d.data.flags.map((f: any) => ({ key: f.key, enabled: f.enabled, updatedAt: f.updatedAt })))
      }
    } catch (e) {
      console.error('Failed to load feature flags:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleFlag = async (key: string, enabled: boolean) => {
    setToggling(key)
    try {
      const res = await fetch(`/api/feature-flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update')
      const d = await res.json()
      setFlags(flags.map((f) => (f.key === key ? { ...f, enabled: d.flag.enabled, updatedAt: d.flag.updatedAt } : f)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update flag')
    } finally {
      setToggling(null)
    }
  }

  const addFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, enabled: false }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      const d = await res.json()
      setFlags([...flags, { key: d.flag.key, enabled: d.flag.enabled, updatedAt: d.flag.updatedAt }].sort((a, b) => a.key.localeCompare(b.key)))
      setNewKey('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create flag')
    } finally {
      setAdding(false)
    }
  }

  const deleteFlag = async (key: string) => {
    if (!confirm(`Delete flag "${key}"?`)) return
    setToggling(key)
    try {
      const res = await fetch(`/api/feature-flags/${key}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete')
      setFlags(flags.filter((f) => f.key !== key))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete flag')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Activity size={22} className="text-[#d8a85b]" />
          Feature Flags
        </h1>
        <p className="text-sm text-[#878981]">Toggle features across the venue</p>
      </div>

      <form onSubmit={addFlag} className="border border-white/[0.08] bg-[#111210] p-4 rounded-lg flex items-end gap-3 max-w-md">
        <div className="flex-1">
          <label className="block text-xs text-[#787a73] mb-1">New Flag Key</label>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. loyalty_program"
            pattern="[a-zA-Z][a-zA-Z0-9_]*"
            className="w-full rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !newKey.trim()}
          className="rounded-md bg-[#d8a85b] py-2 px-4 text-xs font-semibold text-[#1b1914] hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adding ? 'Adding...' : 'Add Flag'}
        </button>
      </form>

      <div className="responsive-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Flag Key</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Status</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Updated</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#777971]">Loading flags...</td>
              </tr>
            ) : flags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#777971]">No feature flags configured.</td>
              </tr>
            ) : (
              flags.map((flag) => (
                <tr key={flag.key} className="border-t border-white/[0.03] items-center">
                  <td className="px-4 py-3 font-mono text-xs">{flag.key}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFlag(flag.key, !flag.enabled)}
                      disabled={toggling === flag.key}
                      className="flex items-center gap-2 text-xs"
                    >
                      {flag.enabled ? (
                        <ToggleRight size={20} className="text-[#7cc58f]" />
                      ) : (
                        <ToggleLeft size={20} className="text-[#555750]" />
                      )}
                      <span className={flag.enabled ? 'text-[#7cc58f]' : 'text-[#787a73]'}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#787a73]">{formatTime(flag.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteFlag(flag.key)}
                      disabled={toggling === flag.key}
                      className="text-red-400 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}