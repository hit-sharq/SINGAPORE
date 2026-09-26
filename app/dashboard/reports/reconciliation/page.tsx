'use client'

import { useEffect, useState } from 'react'
import { Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice, formatTime } from '@/lib/utils'

type ReconciliationReport = {
  date: string
  expectedCash: string
  actualCash: string
  variance: string
  expectedCard: string
  actualCard: string
  cardVariance: string
  expectedMpesa: string
  actualMpesa: string
  mpesaVariance: string
  voids: { id: string; orderNumber: number; reason: string; amount: string; user: string; createdAt: string }[]
  refunds: { id: string; orderNumber: number; reason: string; amount: string; user: string; createdAt: string }[]
  cashDrops: { id: string; amount: string; user: string; createdAt: string }[]
}

export default function ReconciliationReportPage() {
  const [report, setReport] = useState<ReconciliationReport | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const formatKES = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val
    return `KES ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const varianceColor = (variance: string) => {
    const v = parseFloat(variance)
    if (v > 0) return 'text-green-400'
    if (v < 0) return 'text-red-400'
    return 'text-[#7cc58f]'
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/reconciliation?date=${date}`)
      if (res.ok) {
        const d = await res.json()
        setReport(d.data)
      }
    } catch (e) {
      console.error('Failed to load reconciliation report:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [date])

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?entity=payments&startDate=${date}&endDate=${date}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reconciliation-${date}.csv`
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
          <h1 className="text-2xl font-semibold">Daily Reconciliation</h1>
          <p className="text-sm text-[#878981]">Cash, card, and M-Pesa reconciliation with variances</p>
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Cash</p>
              <div className="space-y-1 mt-2 text-sm">
                <div className="flex justify-between"><span>Expected</span><span>{formatKES(report.expectedCash)}</span></div>
                <div className="flex justify-between"><span>Actual</span><span>{formatKES(report.actualCash)}</span></div>
                <div className="flex justify-between border-t border-white/[0.06] pt-1">
                  <span>Variance</span>
                  <span className={varianceColor(report.variance)} font-medium>{formatKES(report.variance)}</span>
                </div>
              </div>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">Card</p>
              <div className="space-y-1 mt-2 text-sm">
                <div className="flex justify-between"><span>Expected</span><span>{formatKES(report.expectedCard)}</span></div>
                <div className="flex justify-between"><span>Actual</span><span>{formatKES(report.actualCard)}</span></div>
                <div className="flex justify-between border-t border-white/[0.06] pt-1">
                  <span>Variance</span>
                  <span className={varianceColor(report.cardVariance)} font-medium>{formatKES(report.cardVariance)}</span>
                </div>
              </div>
            </div>
            <div className="border border-white/[0.08] bg-[#181a17] p-4">
              <p className="text-xs text-[#787a73] uppercase tracking-[0.1em]">M-Pesa</p>
              <div className="space-y-1 mt-2 text-sm">
                <div className="flex justify-between"><span>Expected</span><span>{formatKES(report.expectedMpesa)}</span></div>
                <div className="flex justify-between"><span>Actual</span><span>{formatKES(report.actualMpesa)}</span></div>
                <div className="flex justify-between border-t border-white/[0.06] pt-1">
                  <span>Variance</span>
                  <span className={varianceColor(report.mpesaVariance)} font-medium>{formatKES(report.mpesaVariance)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="font-semibold mb-3">Voids</h3>
            {report.voids.length === 0 ? (
              <p className="text-sm text-[#777971]">No voids</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                      <th className="pb-2">Order</th>
                      <th className="pb-2">Reason</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2">User</th>
                      <th className="pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.voids.map((v) => (
                      <tr key={v.id} className="border-b border-white/[0.03]">
                        <td className="py-2">#{v.orderNumber}</td>
                        <td className="py-2 text-[#787a73]">{v.reason}</td>
                        <td className="py-2 text-right text-red-400">{formatKES(v.amount)}</td>
                        <td className="py-2 text-[#787a73]">{v.user}</td>
                        <td className="py-2 text-[#787a73]">{formatTime(v.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="font-semibold mb-3">Refunds</h3>
            {report.refunds.length === 0 ? (
              <p className="text-sm text-[#777971]">No refunds</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                      <th className="pb-2">Order</th>
                      <th className="pb-2">Reason</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2">User</th>
                      <th className="pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.refunds.map((r) => (
                      <tr key={r.id} className="border-b border-white/[0.03]">
                        <td className="py-2">#{r.orderNumber}</td>
                        <td className="py-2 text-[#787a73]">{r.reason}</td>
                        <td className="py-2 text-right text-[#d8a85b]">{formatKES(r.amount)}</td>
                        <td className="py-2 text-[#787a73]">{r.user}</td>
                        <td className="py-2 text-[#787a73]">{formatTime(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border border-white/[0.08] bg-[#181a17] p-4">
            <h3 className="font-semibold mb-3">Cash Drops</h3>
            {report.cashDrops.length === 0 ? (
              <p className="text-sm text-[#777971]">No cash drops</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#787a73] border-b border-white/[0.06]">
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">User</th>
                      <th className="pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.cashDrops.map((d) => (
                      <tr key={d.id} className="border-b border-white/[0.03]">
                        <td className="py-2 font-medium">{formatKES(d.amount)}</td>
                        <td className="py-2 text-[#787a73]">{d.user}</td>
                        <td className="py-2 text-[#787a73]">{formatTime(d.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[#777971]">No data for this date</div>
      )}
    </div>
  )
}