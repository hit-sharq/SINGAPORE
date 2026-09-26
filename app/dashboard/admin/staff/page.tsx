'use client'

import { useEffect, useState } from 'react'
import { UserCog, UserPlus, Trash2, Plus, Users } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type StaffMember = {
  id: string
  name: string
  email: string
  role: string
  roles: string[]
  status: string
  shiftCount: number
  hasOpenShift: boolean
}

type RoleGrant = {
  id: string
  userId: string
  role: string
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [roleGrants, setRoleGrants] = useState<RoleGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'CASHIER' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [grantLoading, setGrantLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffRes, grantsRes] = await Promise.all([
          fetch('/api/staff'),
          fetch('/api/role-grants'),
        ])
        if (staffRes.ok) {
          const d = await staffRes.json()
          setStaffList(d.data.staff)
        }
        if (grantsRes.ok) {
          const d = await grantsRes.json()
          setRoleGrants(d.data.grants)
        }
      } catch (e) {
        console.error('Failed to load staff:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to invite')
      setShowInviteModal(false)
      setInviteForm({ email: '', name: '', role: 'CASHIER' })
      const staffRes = await fetch('/api/staff')
      if (staffRes.ok) {
        const d = await staffRes.json()
        setStaffList(d.data.staff)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite staff')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleGrantRole = async (userId: string, role: string) => {
    setGrantLoading(userId)
    try {
      const res = await fetch('/api/role-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: role as any }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to grant role')
      const grantsRes = await fetch('/api/role-grants')
      if (grantsRes.ok) {
        const d = await grantsRes.json()
        setRoleGrants(d.data.grants)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to grant role')
    } finally {
      setGrantLoading(null)
    }
  }

  const handleRevokeGrant = async (grantId: string) => {
    try {
      const res = await fetch(`/api/role-grants?id=${grantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke')
      setRoleGrants(roleGrants.filter((g) => g.id !== grantId))
    } catch (err) {
      alert('Failed to revoke role grant')
    }
  }

  const roleOptions = ['CASHIER', 'BARTENDER', 'WAITER', 'INVENTORY_MANAGER', 'MANAGER', 'ADMIN']

  return (
    <div className="min-h-screen bg-[#111210] text-[#f3f0e9] p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <UserCog size={22} className="text-[#d8a85b]" />
          Staff Management
        </h1>
        <p className="text-sm text-[#878981]">Team members, roles, and schedules</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 rounded-md bg-[#d8a85b] px-4 py-2.5 text-xs font-semibold text-[#1b1914] transition hover:bg-[#e4b96d]"
        >
          <UserPlus size={15} />
          Invite Staff
        </button>
      </div>

      <div className="responsive-table">
        <div className="table-card-view grid grid-cols-7 gap-3 px-4 py-3 border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-[0.1em] text-[#787a73] border border-white/[0.08] bg-[#181a17]">
          <div>Name</div>
          <div>Email</div>
          <div>Primary Role</div>
          <div>Additional Roles</div>
          <div>Status</div>
          <div>Shifts</div>
          <div></div>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-[#777971]">Loading staff...</div>
        ) : (
          staffList.map((staff) => (
            <div key={staff.id} className="grid grid-cols-7 gap-3 px-4 py-3 border-b border-white/[0.03] items-center">
              <div className="font-medium">{staff.name}</div>
              <div className="text-[#787a73] text-sm">{staff.email}</div>
              <div>
                <span className="px-2 py-0.5 text-xs rounded bg-white/[0.05]">{staff.role}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {staff.roles.filter((r: string) => r !== staff.role).map((r: string) => (
                  <span key={r} className="px-2 py-0.5 text-xs rounded bg-[#d8a85b]/20 text-[#d8a85b]">{r}</span>
                ))}
              </div>
              <div>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  staff.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {staff.status}
                </span>
              </div>
              <div className="text-sm text-[#787a73]">{staff.shiftCount} {staff.hasOpenShift && <span className="text-green-400 ml-1">●</span>}</div>
              <div className="flex items-center justify-end gap-2">
                {staff.roles.filter((r: string) => r !== staff.role).map((r: string) => {
                    const grant = roleGrants.find(g => g.userId === staff.id && g.role === r)
                    return grant ? (
                      <button
                        key={`${staff.id}-${r}`}
                        onClick={() => handleRevokeGrant(grant.id)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                        title={`Revoke ${r}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null
                  })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="staff-cards space-y-3 px-1">
        {!loading && staffList.map((staff) => (
          <div key={staff.id} className="border border-white/[0.08] bg-[#181a17] rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{staff.name}</p>
                <p className="text-sm text-[#787a73] truncate">{staff.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${staff.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} shrink-0`}>
                {staff.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-xs rounded bg-white/[0.05]">{staff.role}</span>
              {staff.roles.filter((r: string) => r !== staff.role).map((r: string) => (
                <span key={r} className="px-2 py-0.5 text-xs rounded bg-[#d8a85b]/20 text-[#d8a85b]">{r}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-[#787a73]">
              <span>{staff.shiftCount} shifts {staff.hasOpenShift && <span className="text-green-400 ml-1">●</span>}</span>
              <div className="flex items-center gap-1 ml-auto">
{staff.roles.filter((r: string) => r !== staff.role).map((r: string) => {
                    const grant = roleGrants.find(g => g.userId === staff.id && g.role === r)
                    return grant ? (
                      <button
                        key={`${staff.id}-${r}-mobile`}
                        onClick={() => handleRevokeGrant(grant.id)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                        title={`Revoke ${r}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null
                  })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-white/[0.08] bg-[#181a17] p-4">
        <h3 className="font-semibold mb-3">Grant Additional Role</h3>
        <div className="flex flex-wrap gap-3">
          {staffList.map((staff) => roleOptions
            .filter(r => !staff.roles.includes(r))
            .map((role) => (
              <button
                key={`${staff.id}-${role}`}
                onClick={() => handleGrantRole(staff.id, role)}
                disabled={grantLoading === staff.id}
                className="px-3 py-1.5 text-xs rounded border border-white/[0.1] bg-[#181a17] text-[#a4a59e] hover:border-[#d8a85b]/50 hover:text-[#d8a85b] transition disabled:opacity-50"
              >
                +{role} → {staff.name}
              </button>
            ))
          )}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#181a17] border border-white/[0.08] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Staff Member</h3>
            <form onSubmit={handleInvite}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Name</label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    required
                    className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                    className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#787a73] mb-1">Primary Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full rounded-md border border-white/[0.1] bg-[#111210] px-3 py-2 text-sm text-[#f3f0e9] focus:border-[#d8a85b] focus:outline-none"
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm border border-white/[0.1] hover:border-white/[0.3] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 text-sm bg-[#d8a85b] text-[#1b1914] font-medium rounded hover:bg-[#e4b96d] disabled:opacity-50"
                >
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}