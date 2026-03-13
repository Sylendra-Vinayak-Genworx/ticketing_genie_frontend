import React, { useEffect, useState } from 'react'
import { Search, Users, Pencil, Loader2 } from 'lucide-react'
import { authService } from '@/features/auth/services/authService'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/common/LoadingSpinner'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'
import type { User, UserUpdateRequest } from '@/types'

const STAFF_ROLES = ['admin', 'team_lead', 'support_agent']

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')


  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<UserUpdateRequest>({})
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const allUsers = await authService.getAllUsers()
      setUsers(allUsers.filter(u => STAFF_ROLES.includes(u.role)))
    } catch (err) {
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  function handleEdit(user: User) {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name || '',
      customer_tier_id: user.customer_tier_id,
      is_active: user.is_active
    })
  }

  async function handleSave() {
    if (!editingUser) return
    setSaving(true)
    try {
      await authService.updateUser(editingUser.id, editForm)
      toast.success('User updated successfully')
      setEditingUser(null)
      loadData()
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="User Management" subtitle="Manage team leads and support agent profiles" />

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner fullPage text="Loading users…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No users found"
            description={search ? `No matches found for "${search}"` : "No users are registered in the system."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name || u.email} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name || 'No Name'}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User Details"
        footer={
          <>
            <button onClick={() => setEditingUser(null)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </>
        }
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="input-field"
                placeholder="Enter full name"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Account Active</label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}