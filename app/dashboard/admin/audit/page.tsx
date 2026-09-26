'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type AuditLogEntry = {
  id: string
  action: string
  entity: string
  entityId: string | null
  metadata: any
  user: { id: string; name: string; email: string; role: string }
  createdAt: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', entity: '', userId: '', startDate: '', endDate: '' })
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({
    page: 1, limit: 50, total: 0, pages: 0,
  })
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [availableEntities, setAvailableEntities] = useState<string[]>([])

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pagination.limit))
      if (filters.action) params.set('action', filters.action)
      if (filters.entity) params.set('entity', filters.entity)
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const res = await fetch(`/api/audit-logs?${params.toString()}`)
      if (res.ok) {
        const d = await res.json()
        setLogs(d.data.logs)
        setPagination(d.data.pagination)
        setAvailableActions(d.data.filters.actions)
        setAvailableEntities(d.data.filters.entities)
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [])

  const applyFilters = () => {
    setPagination((p) => ({ ...p, page: 1 }))
    fetchLogs(1)
  }

  const clearFilters = () => {
    setFilters({ action: '', entity: '', userId: '', startDate: '', endDate: '' })
    fetchLogs(1)
  }

  const formatMetadata = (metadata: any) => {
    if (!metadata) return '—'
    try {
      return JSON.stringify(metadata)
    } catch {
      return String(metadata)
    }
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ClipboardList size={22} className="text-[#d8a85b]" />
          Audit Logs
        </h1>
        <p className="text-sm text-[#878981]">Track all system changes and actions</p>
      </div>

      <div className="border border-white/[0.08] bg-[#111210] p-4 rounded-lg space-y-3">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            >
              <option value="">All</option>
              {availableActions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Entity</label>
            <select
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            >
              <option value="">All</option>
              {availableEntities.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Date From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#787a73] mb-1">Date To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full h-9 rounded-md border border-white/[0.1] bg-[#181a17] px-3 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 rounded-md bg-[#d8a85b] py-2 text-xs font-semibold text-[#1b1914] hover:bg-[#e4b96d]"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2 text-xs font-medium text-[#a4a59e] hover:bg-white/[0.08]"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="responsive-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Time</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Action</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Entity</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">User</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#777971]">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#777971]">No audit logs found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-white/[0.03]">
                  <td className="px-4 py-2 text-xs text-[#879181]">{formatTime(log.createdAt)}</td>
                  <td className="px-4 py-2 text-xs font-mono">{log.action}</td>
                  <td className="px-4 py-2 text-xs text-[#787a73]">{log.entity}</td>
                  <td className="px-4 py-2 text-xs">{log.user?.name ?? '—'} <span className="text-[#787a73]">({log.user?.email ?? '—'})</span></td>
                  <td className="px-4 py-2 text-xs text-[#787a73] max-w-[200px] truncate">{formatMetadata(log.metadata)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#787a73]">
            {pagination.total} entries · Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#181a17] px-3 py-1.5 text-xs text-[#a4a59e] hover:border-[#d8a85b]/50 hover:text-[#d8a85b] disabled:opacity-40"
            >
              <ChevronLeft size={13} />
              Prev
            </button>
            <button
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchLogs(pagination.page + 1)}
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