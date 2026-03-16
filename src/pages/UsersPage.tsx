import React, { useEffect, useState } from 'react'
import { Search, Users, Pencil, Eye, Plus, Loader2, X, Award } from 'lucide-react'
import { authService } from '@/features/auth/services/authService'
import { ticketService } from '@/features/tickets/services/ticketService'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/common/LoadingSpinner'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'
import type { User, UserUpdateRequest, UserCreateRequest, AgentSkill, UserRole } from '@/types'

const STAFF_ROLES = ['admin', 'team_lead', 'support_agent']
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'support_agent', label: 'Support Agent' },
]

const PROFICIENCY_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', color: 'bg-gray-100 text-gray-700' },
  { value: 'INTERMEDIATE', label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
  { value: 'ADVANCED', label: 'Advanced', color: 'bg-green-100 text-green-700' },
  { value: 'EXPERT', label: 'Expert', color: 'bg-purple-100 text-purple-700' },
]

type ModalMode = 'view' | 'edit' | 'create' | 'skills' | null

interface SkillForm {
  area_id: number
  proficiency_level: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  // Areas of concern for skills
  const [areas, setAreas] = useState<Array<{ area_id: number; name: string }>>([])

  // Edit/Create form
  const [userForm, setUserForm] = useState<Partial<UserCreateRequest & UserUpdateRequest>>({
    email: '',
    full_name: '',
    role: 'support_agent',
    is_active: true,
  })

  // Skills management
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [newSkill, setNewSkill] = useState<SkillForm>({ area_id: 0, proficiency_level: 'BEGINNER' })

  async function loadData() {
    setLoading(true)
    try {
      const [allUsers, areasData] = await Promise.all([
        authService.getAllUsers(),
        ticketService.getAreasOfConcern(),
      ])
      setUsers(allUsers.filter(u => STAFF_ROLES.includes(u.role)))
      setAreas(areasData)
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

  function openModal(mode: ModalMode, user?: User) {
    setModalMode(mode)
    setSelectedUser(user || null)

    if (mode === 'create') {
      setUserForm({
        email: '',
        full_name: '',
        role: 'support_agent',
        is_active: true,
      })
    } else if (mode === 'edit' && user) {
      setUserForm({
        full_name: user.full_name || '',
        is_active: user.is_active,
      })
    } else if (mode === 'skills' && user) {
      loadAgentSkills(user.id)
    }
  }

  function closeModal() {
    setModalMode(null)
    setSelectedUser(null)
    setUserForm({})
    setAgentSkills([])
    setNewSkill({ area_id: 0, proficiency_level: 'BEGINNER' })
  }

  async function loadAgentSkills(userId: string) {
    setSkillsLoading(true)
    try {
      const response = await authService.getUserSkills(userId)
      setAgentSkills(response.skills)
    } catch (err) {
      toast.error('Failed to load agent skills')
    } finally {
      setSkillsLoading(false)
    }
  }

  async function handleCreateUser() {
    if (!userForm.email || !userForm.role) {
      toast.error('Email and role are required')
      return
    }

    setSaving(true)
    try {
      const response = await authService.createUser({
        email: userForm.email,
        full_name: userForm.full_name || '',
        role: userForm.role as any,
      })
      toast.success(
        <div>
          <p className="font-semibold">User created successfully</p>
          <p className="text-sm text-gray-600">Temporary password: {response.temporary_password}</p>
        </div>,
        { duration: 10000 }
      )
      closeModal()
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return
    setSaving(true)
    try {
      await authService.updateUser(selectedUser.id, {
        full_name: userForm.full_name,
        is_active: userForm.is_active,
      })
      toast.success('User updated successfully')
      closeModal()
      loadData()
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSkill() {
    if (!selectedUser || !newSkill.area_id) {
      toast.error('Please select an area')
      return
    }

    setSaving(true)
    try {
      await authService.updateUserSkills(selectedUser.id, {
        skills: [
          ...agentSkills.map(s => ({ area_id: s.area_id, proficiency_level: s.proficiency_level })),
          { area_id: newSkill.area_id, proficiency_level: newSkill.proficiency_level },
        ],
      })
      toast.success('Skill added successfully')
      loadAgentSkills(selectedUser.id)
      setNewSkill({ area_id: 0, proficiency_level: 'BEGINNER' })
    } catch (err) {
      toast.error('Failed to add skill')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveSkill(areaId: number) {
    if (!selectedUser) return
    setSaving(true)
    try {
      await authService.updateUserSkills(selectedUser.id, {
        skills: agentSkills
          .filter(s => s.area_id !== areaId)
          .map(s => ({ area_id: s.area_id, proficiency_level: s.proficiency_level })),
      })
      toast.success('Skill removed successfully')
      loadAgentSkills(selectedUser.id)
    } catch (err) {
      toast.error('Failed to remove skill')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateSkillProficiency(areaId: number, newLevel: string) {
    if (!selectedUser) return
    setSaving(true)
    try {
      await authService.updateUserSkills(selectedUser.id, {
        skills: agentSkills.map(s =>
          s.area_id === areaId
            ? { area_id: s.area_id, proficiency_level: newLevel }
            : { area_id: s.area_id, proficiency_level: s.proficiency_level }
        ),
      })
      toast.success('Skill updated successfully')
      loadAgentSkills(selectedUser.id)
    } catch (err) {
      toast.error('Failed to update skill')
    } finally {
      setSaving(false)
    }
  }

  function getModalTitle() {
    switch (modalMode) {
      case 'view': return 'User Details'
      case 'edit': return 'Edit User'
      case 'create': return 'Create New User'
      case 'skills': return 'Manage Agent Skills'
      default: return ''
    }
  }

  function getModalFooter() {
    if (modalMode === 'view') {
      return (
        <button onClick={closeModal} className="btn-secondary">Close</button>
      )
    }

    if (modalMode === 'create') {
      return (
        <>
          <button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button>
          <button
            onClick={handleCreateUser}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create User
          </button>
        </>
      )
    }

    if (modalMode === 'edit') {
      return (
        <>
          <button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button>
          <button
            onClick={handleUpdateUser}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </>
      )
    }

    if (modalMode === 'skills') {
      return (
        <button onClick={closeModal} className="btn-secondary">Close</button>
      )
    }

    return null
  }

  const availableAreas = areas.filter(
    area => !agentSkills.some(s => s.area_id === area.area_id)
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        subtitle="Manage team leads and support agent profiles"
        actions={
          <button
            onClick={() => openModal('create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        }
      />

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
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal('view', u)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', u)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.role === 'support_agent' && (
                          <button
                            onClick={() => openModal('skills', u)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Manage Skills"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for View/Edit/Create/Skills */}
      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={getModalTitle()}
        footer={getModalFooter()}
      >
        {/* View Mode */}
        {modalMode === 'view' && selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <Avatar name={selectedUser.full_name || selectedUser.email} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedUser.full_name || 'No Name'}</h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                <RoleBadge role={selectedUser.role} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                <span className={`badge ${selectedUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Verified</label>
                <span className={`badge ${selectedUser.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedUser.is_verified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Created</label>
                <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
              </div>
            </div>

            {selectedUser.lead_id && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reports To</label>
                <p className="text-sm text-gray-900">{selectedUser.lead_id}</p>
              </div>
            )}
          </div>
        )}

        {/* Create Mode */}
        {modalMode === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={userForm.email || ''}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={userForm.full_name || ''}
                onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="input-field"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={userForm.role || 'support_agent'}
                onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className="input-field"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> A temporary password will be generated and displayed after creation.
                The user will be required to change it on first login.
              </p>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {modalMode === 'edit' && selectedUser && (
          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Editing user: <span className="font-medium text-gray-900">{selectedUser.email}</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={userForm.full_name || ''}
                onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="input-field"
                placeholder="Enter full name"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={userForm.is_active}
                onChange={(e) => setUserForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Account Active</label>
            </div>
          </div>
        )}

        {/* Skills Management Mode */}
        {modalMode === 'skills' && selectedUser && (
          <div className="space-y-5">
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                Managing skills for: <span className="font-medium text-gray-900">{selectedUser.full_name || selectedUser.email}</span>
              </p>
            </div>

            {/* Existing Skills */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Skills</h4>
              {skillsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : agentSkills.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No skills assigned yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agentSkills.map(skill => {
                    const profLevel = PROFICIENCY_LEVELS.find(p => p.value === skill.proficiency_level)
                    return (
                      <div
                        key={skill.area_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{skill.area_name}</p>
                          <select
                            value={skill.proficiency_level}
                            onChange={(e) => handleUpdateSkillProficiency(skill.area_id, e.target.value)}
                            disabled={saving}
                            className="text-xs mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            {PROFICIENCY_LEVELS.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(skill.area_id)}
                          disabled={saving}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Skill"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add New Skill */}
            {availableAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Skill</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Area</label>
                    <select
                      value={newSkill.area_id}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, area_id: parseInt(e.target.value) }))}
                      className="input-field"
                    >
                      <option value={0}>Select an area...</option>
                      {availableAreas.map(area => (
                        <option key={area.area_id} value={area.area_id}>{area.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Proficiency Level</label>
                    <select
                      value={newSkill.proficiency_level}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, proficiency_level: e.target.value }))}
                      className="input-field"
                    >
                      {PROFICIENCY_LEVELS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddSkill}
                    disabled={saving || !newSkill.area_id}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Skill
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}