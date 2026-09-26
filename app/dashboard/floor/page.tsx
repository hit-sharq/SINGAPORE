'use client'

import { useEffect, useState } from 'react'
import { Plus, Table2, X, Users, Truck, RefreshCw } from 'lucide-react'

type Table = {
  id: string
  name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
  currentOrder: { id: string; number: number; guest: { name: string } } | null
}

export default function FloorPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTable, setShowAddTable] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState(4)
  const [updatingTable, setUpdatingTable] = useState<string | null>(null)

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
        throw new Error(error.error || 'Failed to create table')
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
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update table')
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
    setUpdatingTable(tableId)
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete table')
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

  const getTableDetail = (table: Table) => {
    if (table.status === 'OCCUPIED' && table.currentOrder) {
      return `Order #${table.currentOrder.number} · ${table.currentOrder.guest.name}`
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {tables.length === 0 ? (
          <p className="col-span-full text-xs text-[#777971]">No tables configured.</p>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className={`border p-4 ${
                table.status === 'OCCUPIED'
                  ? 'border-[#d8a85b]/40 bg-[#211e17]'
                  : 'border-white/[0.08] bg-[#181a17]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#2d302a] text-[#b4b4aa]">
                  <Table2 size={17} />
                </div>
                <span
                  className={`text-[9px] font-semibold tracking-[0.12em] ${
                    table.status === 'OCCUPIED'
                      ? 'text-[#d8a85b]'
                      : table.status === 'RESERVED'
                      ? 'text-[#d78d6f]'
                      : table.status === 'CLEANING'
                      ? 'text-[#a4a59e]'
                      : 'text-[#7cc58f]'
                  }`}
                >
                  {table.status}
                </span>
              </div>
              <p className="mt-5 text-[11px] font-semibold tracking-[0.13em] text-[#d7d6ce]">{table.name}</p>
              <p className="mt-1 text-xs text-[#777971]">{getTableDetail(table)}</p>
              {table.status === 'OCCUPIED' && table.currentOrder && (
                <p className="mt-3 text-[10px] text-[#d8a85b]">{table.currentOrder.guest.name}</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                {(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] as const).map((status) => (
                  <button
                    key={status}
                    disabled={updatingTable === table.id || table.status === status}
                    onClick={() => handleStatusChange(table.id, status)}
                    className={`flex-1 text-[9px] font-semibold px-2 py-1.5 rounded ${
                      table.status === status
                        ? `bg-[${statusColors[status]}]/20 text-[${statusColors[status]}]`
                        : 'bg-white/[0.04] text-[#777971] hover:bg-white/[0.08]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleDeleteTable(table.id, table.name)}
                  disabled={updatingTable === table.id}
                  className="flex-1 text-[9px] text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
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