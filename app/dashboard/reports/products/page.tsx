'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { formatPrice, formatTime } from '@/lib/utils'

type ProductsReport = {
  periodDays: number
  products: {
    id: string
    name: string
    category: string
    stock: string
    reorderAt: string
    sold: number
    revenue: string
    margin: string
  }[]
  stockMovements: {
    id: string
    product: string
    type: 'IN' | 'OUT' | 'ADJUSTMENT'
    quantity: number
    reason: string
    createdAt: string
  }[]
}

export default function ProductsReportPage() {
  const [report, setReport] = useState<ProductsReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)

  const formatKES = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val
    return `KES ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/products?days=${days}`)
      if (res.ok) {
        const d = await res.json()
        setReport(d.data)
      }
    } catch (e) {
      console.error('Failed to load products report:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [days])

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?entity=products`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `products-report-${days}d.csv`
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
          <h1 className="text-2xl font-semibold">Product Performance</h1>
          <p className="text-sm text-[#878981]">Sales, margins, and stock movements</p>
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
        <div className="space-y-4">
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="font-semibold mb-3">Product Performance (Last {report.periodDays} Days)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-right">Stock</th>
                    <th className="pb-2 text-right">Reorder</th>
                    <th className="pb-2 text-right">Sold</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {report.products.map((p) => (
                    <tr key={p.id} className="border-b border-white/[0.03]">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-[#787a73]">{p.category || '-'}</td>
                      <td className="py-2 text-right">{parseFloat(p.stock).toFixed(1)}</td>
                      <td className="py-2 text-right">{parseFloat(p.reorderAt).toFixed(1)}</td>
                      <td className="py-2 text-right">{p.sold}</td>
                      <td className="py-2 text-right">{formatKES(p.revenue)}</td>
                      <td className="py-2 text-right">{p.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="font-semibold mb-3">Recent Stock Movements</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2">Reason</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {report.stockMovements.slice(0, 50).map((m) => (
                    <tr key={m.id} className="border-b border-white/[0.03]">
                      <td className="py-2">{m.product}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${m.type === 'IN' ? 'bg-green-500/20 text-green-400' : m.type === 'OUT' ? 'bg-red-500/20 text-red-400' : 'bg-[#d8a85b]/20 text-[#d8a85b]'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2 text-right">{m.quantity}</td>
                      <td className="py-2 text-[#787a73]">{m.reason}</td>
                      <td className="py-2 text-[#787a73]">{formatTime(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[#777971]">No data available</div>
      )}
    </div>
  )
}