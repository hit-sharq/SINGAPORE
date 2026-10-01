'use client'

import { useEffect, useState } from 'react'
import { Plus, Table2, X, Trash2, MoreVertical } from 'lucide-react'

type Table = {
  id: string
  name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
  orders: { id: string; number: number; total: string; payments: { method: string; status: string }[] }[]
}

export default function FloorPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTable, setShowAddTable] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState(4)
  const [updatingTable, setUpdatingTable] = useState<string | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tables')
      if (res.ok) {
        const data = await res.json()
        setTables(data.data.tables)
      }
    } catch (e) {
      console.error('Failed to load tables:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTable = async () => {
    if (!newTableName.trim()) return
    setUpdatingTable('add')
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName.trim(), capacity: newTableCapacity }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create table')
      }
      setShowAddTable(false)
      setNewTableName('')
      setNewTableCapacity(4)
      loadTables()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create table')
    } finally {
      setUpdatingTable(null)
    }
  }

  const handleStatusChange = async (tableId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING') => {
    setUpdatingTable(tableId)
    setShowActions(null)
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update table')
      }
      loadTables()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update table')
    } finally {
      setUpdatingTable(null)
    }
  }

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    if (!confirm(`Delete table "${tableName}"? This cannot be undone.`)) return
    setShowActions(null)
    setUpdatingTable(tableId)
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete table')
      }
      loadTables()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete table')
    } finally {
      setUpdatingTable(null)
    }
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: '#7cc58f',
    OCCUPIED: '#d8a85b',
    RESERVED: '#d78d6f',
    CLEANING: '#a4a59e',
  }

  /**
   * A live order makes a table occupied regardless of the stored status. The
   * status column can be left stale by a manual override, and a table with a
   * running tab reading as "Available" invites a second party onto it.
   */
  const isOccupied = (table: Table) => (table.orders?.length ?? 0) > 0

  const getTableDetail = (table: Table) => {
    if (isOccupied(table)) {
      const order = table.orders![0]
      return `Order #${order.number}`
    }
    if (table.status === 'RESERVED') return 'Reserved'
    if (table.status === 'CLEANING') return 'Cleaning in progress'
    return `${table.capacity} seats · Available`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
        <div className="text-center py-8 text-[#777971]">Loading floor plan...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Floor & Pool</h1>
          <p className="text-sm text-[#878981]">Table management and pool floor</p>
        </div>
        <button
          onClick={() => setShowAddTable(true)}
          className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"
        >
          <Plus size={15} />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.length === 0 ? (
          <p className="col-span-full text-center text-xs text-[#777971] py-8">No tables configured.</p>
        ) : (
          tables.map((table) => {
            const occupied = isOccupied(table)
            // Show OCCUPIED whenever a live order exists, so the badge and
            // border agree with the detail line instead of contradicting it.
            const shownStatus = occupied ? 'OCCUPIED' : table.status
            const color = statusColors[shownStatus]
            return (  <div
                key={table.id}
                className={`relative border p-4 min-h-[160px] flex flex-col overflow-visible ${
                  shownStatus === 'OCCUPIED'
                    ? 'border-[#d8a85b]/40 bg-[#211e17]'
                    : 'border-white/[0.08] bg-[#181a17]'
                }`}
              >
                {/* Status badge - current state */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-[#2d302a] text-[#b4b4aa] shrink-0">
                    <Table2 size={16} />
                  </div>
                  <span
                    className={`text-[9px] font-semibold tracking-[0.12em] px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                      shownStatus === 'OCCUPIED'
                        ? 'text-[#d8a85b] bg-[#d8a85b]/15'
                        : shownStatus === 'RESERVED'
                        ? 'text-[#d78d6f] bg-[#d78d6f]/15'
                        : shownStatus === 'CLEANING'
                        ? 'text-[#a4a59e] bg-[#a4a59e]/15'
                        : 'text-[#7cc58f] bg-[#7cc58f]/15'
                    }`}
                  >
                    {shownStatus}
                  </span>
                </div>

                {/* Table name & detail */}
                <div className="mt-4 flex-1 min-w-0">
                  <p className="text-[12px] font-semibold tracking-[0.1em] text-[#d7d6ce] truncate">{table.name}</p>
                  <p className="mt-1 text-xs text-[#777971] truncate">{getTableDetail(table)}</p>
                  {shownStatus === 'OCCUPIED' && table.orders?.length > 0 && (
                    <p className="mt-2 text-[10px] text-[#d8a85b] truncate">Order #{table.orders[0].number}</p>
                  )}
                </div>

                {/* Actions dropdown */}
                <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowActions(showActions === table.id ? null : table.id)}
                    className="p-1.5 text-[#777971] hover:text-white hover:bg-white/[0.05] rounded transition"
                    aria-label="Table actions"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showActions === table.id && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#181a17] border border-white/[0.08] rounded-lg shadow-xl py-1 z-50">
                      {(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] as const).map((status) => {
                        const statusColor = statusColors[status]
                        return (
                          <button
                            key={status}
                            disabled={updatingTable === table.id || table.status === status}
                            onClick={() => handleStatusChange(table.id, status)}
                            className={`w-full text-left px-3 py-2 text-[11px] font-medium transition ${
                              table.status === status
                                ? `text-[${statusColor}] bg-[${statusColor}]/10`
                                : 'text-[#a4a59e] hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            {table.status === status ? '✓ ' : ''}Set to {status}
                          </button>
                        )
                      })}
                      <hr className="my-1 border-white/[0.06]" />
                      <button
                        disabled={updatingTable === table.id}
                        onClick={() => handleDeleteTable(table.id, table.name)}
                        className="w-full text-left px-3 py-2 text-[11px] font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {showAddTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/[0.1] bg-[#171815] shadow-2xl rounded-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#d8a85b]">Add Table</p>
                <h2 className="mt-1 text-lg font-semibold">New table</h2>
              </div>
              <button onClick={() => setShowAddTable(false)} className="text-[#8c8e86] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#777971] mb-1">Table Name</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. Pool Table 1"
                  className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none placeholder:text-[#666860] focus:border-[#d8a85b]/60"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#777971] mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full h-10 rounded-md border border-white/[0.1] bg-[#20221e] px-3 text-sm outline-none focus:border-[#d8a85b]/60"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddTable(false)}
                  className="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-[#d0d0c9] hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  disabled={updatingTable === 'add' || !newTableName.trim()}
                  onClick={handleAddTable}
                  className="flex-1 rounded-md bg-[#d8a85b] py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingTable === 'add' ? 'Adding...' : 'Create Table'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}