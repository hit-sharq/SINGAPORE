'use client'

import { useEffect, useState } from 'react'
import { Download, Users, TrendingUp } from 'lucide-react'
import { formatPrice, formatTime } from '@/lib/utils'

type CustomersReport = {
  periodDays: number
  summary: {
    totalCustomers: number
    newCustomers: number
    returningRate: string
    totalRevenue: string
    avgOrderValue: string
  }
  topCustomers: {
    id: string
    name: string
    phone: string | null
    email: string | null
    orderCount: number
    totalSpent: string
    avgOrderValue: string
    lastOrder: string
    firstOrder: string
  }[]
}

export default function CustomersReportPage() {
  const [report, setReport] = useState<CustomersReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(90)

  const formatKES = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val
    return `KES ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/customers?days=${days}`)
      if (res.ok) {
        const d = await res.json()
        setReport(d.data)
      }
    } catch (e) {
      console.error('Failed to load customers report:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [days])

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?entity=customers`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers-report-${days}d.csv`
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
          <h1 className="text-2xl font-semibold">Customer Analytics</h1>
          <p className="text-sm text-[#878981]">Customer acquisition, retention, and lifetime value</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60"
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
            <option value={365}>Last 365 days</option>
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
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em] flex items-center gap-1">
                <Users size={12} />
                Total Customers
              </p>
              <p className="mt-1 text-2xl font-semibold">{report.summary.totalCustomers}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em] flex items-center gap-1">
                <TrendingUp size={12} className="text-green-400" />
                New Customers
              </p>
              <p className="mt-1 text-2xl font-semibold text-green-400">{report.summary.newCustomers}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Returning Rate</p>
              <p className="mt-1 text-2xl font-semibold">{report.summary.returningRate}%</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Total Revenue</p>
              <p className="mt-1 text-2xl font-semibold">{formatKES(report.summary.totalRevenue)}</p>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Avg Order Value</p>
              <p className="mt-1 text-2xl font-semibold">{formatKES(report.summary.avgOrderValue)}</p>
            </div>
          </div>

          <div className="border border-white/[0.08] bg-[#181a17] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="font-semibold">Top Customers by Spend</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Customer</th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Contact</th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Orders</th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Total Spent</th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-right">Avg Order</th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">First Order</th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em]">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topCustomers.map((c) => (
                    <tr key={c.id} className="border-t border-white/[0.03]">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-[#787a73]">
                        {c.phone && <div className="text-xs">{c.phone}</div>}
                        {c.email && <div className="text-xs">{c.email}</div>}
                        {!c.phone && !c.email && <span className="text-xs text-[#555750]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">{c.orderCount}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatKES(c.totalSpent)}</td>
                      <td className="px-4 py-3 text-right">{formatKES(c.avgOrderValue)}</td>
                      <td className="px-4 py-3 text-[#787a73] text-xs">{formatTime(c.firstOrder)}</td>
                      <td className="px-4 py-3 text-[#787a73] text-xs">{formatTime(c.lastOrder)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.topCustomers.length === 0 && (
              <div className="px-4 py-8 text-center text-[#777971]">No customer data for this period</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[#777971]">No data available</div>
      )}
    </div>
  )
}