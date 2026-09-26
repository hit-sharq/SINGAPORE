'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { formatPrice, formatTime } from '@/lib/utils'

type StaffReport = {
  periodDays: number
  staff: {
    id: string
    name: string
    email: string
    role: string
    shiftCount: number
    totalHours: string
    salesCount: number
    salesTotal: string
    avgOrderValue: string
    voids: number
    refunds: number
  }[]
}

export default function StaffReportPage() {
  const [report, setReport] = useState<StaffReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)

  const formatKES = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val
    return `KES ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/staff?days=${days}`)
      if (res.ok) {
        const d = await res.json()
        setReport(d.data)
      }
    } catch (e) {
      console.error('Failed to load staff report:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [days])

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?entity=staff`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `staff-report-${days}d.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      alert('Failed to export report')
    }
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Staff Performance</h1>
          <p className="text-sm text-[#878981]">Shift hours, sales, and productivity metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#777971]">Loading report...</div>
      ) : report ? (
        <div className="border border-white/[0.08] bg-[#181a17] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Staff</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Role</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Shifts</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Hours</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Orders</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Sales</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Avg Order</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Voids</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Refunds</th>
                </tr>
              </thead>
              <tbody>
                {report.staff.map((s) => (
                  <tr key={s.id} className="border-t border-white/[0.03]">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-[#787a73]">{s.role}</td>
                    <td className="px-4 py-3 text-right">{s.shiftCount}</td>
                    <td className="px-4 py-3 text-right">{parseFloat(s.totalHours).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">{s.salesCount}</td>
                    <td className="px-4 py-3 text-right">{formatKES(s.salesTotal)}</td>
                    <td className="px-4 py-3 text-right">{formatKES(s.avgOrderValue)}</td>
                    <td className="px-4 py-3 text-right text-red-400">{s.voids}</td>
                    <td className="px-4 py-3 text-right text-[#d8a85b]">{s.refunds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {report.staff.length === 0 && (
            <div className="px-4 py-8 text-center text-[#777971]">No staff data for this period</div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-[#777971]">No data available</div>
      )}
    </div>
  )
}