'use client'

import { useEffect, useState } from 'react'
import { Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatTime, formatPrice } from '@/lib/utils'

type DailyReport = {
  date: string
  revenue: string
  orderCount: number
  avgOrderValue: string
  voids: number
  refunds: number
  paymentMix: { method: string; amount: string }[]
  topProducts: { name: string; sold: number; revenue: string }[]
}

export default function DailyReportPage() {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const formatKES = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val
    return `KES ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/daily?date=${date}`)
      if (res.ok) {
        const d = await res.json()
        setReport(d.data)
      }
    } catch (e) {
      console.error('Failed to load daily report:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [date])

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?entity=orders&startDate=${date}&endDate=${date}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daily-report-${date}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      alert('Failed to export report')
    }
  }

  const prevDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }

  const nextDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    if (d <= new Date()) setDate(d.toISOString().split('T')[0])
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Daily Report</h1>
          <p className="text-sm text-[#878981]">Revenue, orders, and payment breakdown by day</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevDay} className="p-2 text-[#777971] hover:text-white rounded">
            <ChevronLeft size={18} />
          </button>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777971]" size={16} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-40 pl-9 pr-4 py-2 border border-white/[0.1] bg-[#20221e] text-sm outline-none focus:border-[#d8a85b]/60"
            />
          </div>
          <button onClick={nextDay} disabled={new Date(date) >= new Date(new Date().setHours(0,0,0,0))} className="p-2 text-[#777971] hover:text-white rounded disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#777971]">Loading report...</div>
      ) : report ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Revenue</p>
              <p className="mt-1 text-2xl font-semibold">{formatKES(report.revenue)}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Orders</p>
              <p className="mt-1 text-2xl font-semibold">{report.orderCount}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Avg Order</p>
              <p className="mt-1 text-2xl font-semibold">{formatKES(report.avgOrderValue)}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Voids / Refunds</p>
              <p className="mt-1 text-2xl font-semibold">{report.voids} / {report.refunds}</p>
            </div>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="font-semibold mb-3">Payment Mix</h3>
            <div className="flex flex-wrap gap-4">
              {report.paymentMix.map((p) => (
                <div key={p.method} className="text-sm">
                  <span className="text-[#787a73]">{p.method}:</span>{' '}
                  <span className="font-medium">{formatKES(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="font-semibold mb-3">Top Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-right">Sold</th>
                    <th className="pb-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.name} className="border-b border-white/[0.03]">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-right">{p.sold}</td>
                      <td className="py-2 text-right">{formatKES(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[#777971]">No data for this date</div>
      )}
    </div>
  )
}