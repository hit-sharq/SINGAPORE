'use client'

import { useEffect, useState } from 'react'
import { Truck, FileText, ChevronLeft, ChevronRight, CalendarDays, Package, CreditCard, Users, UserCog } from 'lucide-react'
import { formatTime } from '@/lib/utils'

const exportEntities = [
  { value: 'orders', label: 'Orders' },
  { value: 'products', label: 'Products' },
  { value: 'customers', label: 'Customers' },
  { value: 'staff', label: 'Staff' },
  { value: 'shifts', label: 'Shifts' },
  { value: 'payments', label: 'Payments' },
  { value: 'stockMovements', label: 'Stock Movements' },
  { value: 'auditLogs', label: 'Audit Logs' },
] as const

export default function DataExportPage() {
  const [exports, setExports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({
    page: 1, limit: 20, total: 0, pages: 0,
  })
  const [form, setForm] = useState({
    entity: 'orders' as (typeof exportEntities)[number]['value'],
    format: 'json' as 'json' | 'csv',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    fetchExports(1)
  }, [])

  const fetchExports = async (page = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data-export?page=${page}&limit=${pagination.limit}`)
      if (res.ok) {
        const d = await res.json()
        setExports(d.data.exports)
        setPagination(d.data.pagination)
      }
    } catch (e) {
      console.error('Failed to load exports:', e)
    } finally {
      setLoading(false)
    }
  }

  const runExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setExportLoading(true)
    try {
      const res = await fetch('/api/data-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: form.entity,
          format: form.format,
          dateFrom: form.dateFrom || undefined,
          dateTo: form.dateTo || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to export')
      const d = await res.json()
      if (form.format === 'json') {
        alert(`Export complete: ${d.count} records archived`)
        fetchExports(1)
      } else {
        alert('CSV exported (download may have started)')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export')
    } finally {
      setExportLoading(false)
    }
  }

  const downloadArchive = (archiveId: string) => {
    window.open(`/api/data-export?archive=${archiveId}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Truck size={22} className="text-[#d8a85b]" />
          Data Export
        </h1>
        <p className="text-sm text-[#878981]">Export reports and data backups</p>
      </div>

      <form onSubmit={runExport} className="border border-white/[0.08] bg-[#111210] p-4 rounded-lg space-y-3 max-w-md">
        <h4 className="font-semibold text-sm">New Export</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Entity</label>
            <select
              value={form.entity}
              onChange={(e) => setForm({ ...form, entity: e.target.value as any })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            >
              {exportEntities.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Format</label>
            <select
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value as 'json' | 'csv' })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Date From</label>
            <input
              type="date"
              value={form.dateFrom}
              onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Date To</label>
            <input
              type="date"
              value={form.dateTo}
              onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={exportLoading}
          className="w-full rounded-md bg-[#d8a85b] py-2 text-xs font-semibold text-[#1b1914] hover:bg-[#e4b96d] disabled:opacity-50"
        >
          {exportLoading ? 'Exporting...' : 'Run Export'}
        </button>
      </form>

      <div className="border border-white/[0.08] bg-[#181a17] rounded-lg">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <h4 className="font-semibold text-sm">Recent Exports</h4>
          <span className="text-xs text-[#787a73]">{pagination.total} total</span>
        </div>
        <div className="responsive-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em]">Entity</th>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em]">Records</th>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em]">Format</th>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em]">Archived</th>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#777971]">Loading...</td>
                </tr>
              ) : exports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#777971]">No exports yet.</td>
                </tr>
              ) : (
                exports.map((exp) => (
                  <tr key={exp.id} className="border-t border-white/[0.03]">
                    <td className="px-4 py-2">{exp.entity}</td>
                    <td className="px-4 py-2 text-[#787a73]">{Array.isArray(exp.payload?.data) ? exp.payload.data.length : '—'}</td>
                    <td className="px-4 py-2 text-[#787a73]">{exp.payload?.format ?? 'json'}</td>
                    <td className="px-4 py-2 text-[#787a73]">{formatTime(exp.archivedAt)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => downloadArchive(exp.id)}
                        className="text-xs text-[#d8a85b] hover:underline flex items-center gap-1"
                      >
                        <FileText size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#787a73]">
            {pagination.total} entries · Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchExports(pagination.page - 1)}
              className="flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-1.5 text-xs text-[#a4a59e] hover:border-[#d8a85b]/50 hover:text-[#d8a85b] disabled:opacity-40"
            >
              <ChevronLeft size={13} />
              Prev
            </button>
            <button
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchExports(pagination.page + 1)}
              className="flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-1.5 text-xs text-[#a4a59e] hover:border-[#d8a85b]/50 hover:text-[#d8a85b] disabled:opacity-40"
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}