import React from 'react'
import { Search, Users, Pencil, Eye, Plus, Loader2, X, Award, UserCheck, UserX, ShieldCheck, Crown, Shield, Headphones } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/common/LoadingSpinner'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/utils'
import type { UserRole } from '@/types'
import type { TabView } from '../types'
import { ROLE_OPTIONS, PROFICIENCY_LEVELS, tierStyle } from '../constants'
import { useUserManagement } from '../hooks/useUserManagement'

export default function UsersPage() {
  const {
    loading, areas, filtered,
    adminUsers, leadUsers, agentUsers, customerUsers,
    search, setSearch, activeTab, switchTab,
    modalMode, selectedUser, openModal, closeModal, modalTitle,
    saving, togglingId,
    userForm, setUserForm,
    handleCreateUserAndClose, handleUpdateUser, handleToggleCustomer,
    agentSkills, skillsLoading, newSkill, setNewSkill, availableAreas,
    handleAddSkill, handleRemoveSkill, handleUpdateSkillProficiency,
    createSkills, createNewSkill, setCreateNewSkill, availableCreateAreas,
    handleAddCreateSkill, handleRemoveCreateSkill,
    getTierName, getUserName,
  } = useUserManagement()

  const modalFooter = modalMode === 'view' || modalMode === 'skills'
    ? <button onClick={closeModal} className="btn-secondary">Close</button>
    : modalMode === 'create'
    ? <><button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button><button onClick={handleCreateUserAndClose} disabled={saving} className="btn-primary flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Create User</button></>
    : modalMode === 'edit'
    ? <><button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button><button onClick={handleUpdateUser} disabled={saving} className="btn-primary flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save Changes</button></>
    : null

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        subtitle="Manage staff profiles and customer accounts"
        actions={
          <button onClick={() => openModal('create')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create User
          </button>
        }
      />

      {/* Tab Toggle */}
      <div className="card p-1 inline-flex rounded-xl gap-1 flex-wrap">
        {([
          ['support_agent', 'Agents',    agentUsers.length,    <Headphones className="w-4 h-4" />],
          ['team_lead',     'Leads',     leadUsers.length,     <ShieldCheck className="w-4 h-4" />],
          ['admin',         'Admins',    adminUsers.length,    <Shield className="w-4 h-4" />],
          ['customers',     'Customers', customerUsers.length, <Crown className="w-4 h-4" />],
        ] as const).map(([tab, label, count, icon]) => (
          <button
            key={tab}
            onClick={() => switchTab(tab as TabView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {icon}
            {label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
            description={search ? `No matches for "${search}"` : 'No users found in this category.'}
          />
        ) : activeTab !== 'customers' ? (
          /* ─── Staff Table (Admin / Lead / Agent) ───────────────────────── */
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
                        <button onClick={() => openModal('view', u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openModal('edit', u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit User"><Pencil className="w-4 h-4" /></button>
                        {u.role === 'support_agent' && (
                          <button onClick={() => openModal('skills', u)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Manage Skills"><Award className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── Customers Table ─────────────────────────────────────────── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Verified</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => {
                  const ts = tierStyle(u.customer_tier_id)
                  const isToggling = togglingId === u.id
                  return (
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
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ts.bg} ${ts.text} ${ts.border}`}>
                          <Crown className="w-3 h-3" />
                          {getTierName(u.customer_tier_id)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          {u.is_active ? (
                            <button
                              onClick={() => handleToggleCustomer(u)}
                              disabled={isToggling}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                            >
                              {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleCustomer(u)}
                              disabled={isToggling}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                            >
                              {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalMode !== null} onClose={closeModal} title={modalTitle} footer={modalFooter}>

        {/* View */}
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
              <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label><RoleBadge role={selectedUser.role} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label><span className={`badge ${selectedUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedUser.is_active ? 'Active' : 'Inactive'}</span></div>
              <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Verified</label><span className={`badge ${selectedUser.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedUser.is_verified ? 'Verified' : 'Not Verified'}</span></div>
              <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Created</label><p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p></div>
            </div>
            {selectedUser.lead_id && <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reports To</label><p className="text-sm text-gray-900">{getUserName(selectedUser.lead_id)}</p></div>}

            {/* Agent Skills in view modal */}
            {selectedUser.role === 'support_agent' && (
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Skills</label>
                {skillsLoading ? (
                  <div className="flex items-center gap-2 py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /><span className="text-sm text-gray-400">Loading skills…</span></div>
                ) : agentSkills.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No skills assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {agentSkills.map(skill => {
                      const prof = PROFICIENCY_LEVELS.find(p => p.value === skill.proficiency_level)
                      return (
                        <span key={skill.area_id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Award className="w-3 h-3" />
                          {skill.area_name}
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${prof?.color || 'bg-gray-100 text-gray-700'}`}>
                            {prof?.label || skill.proficiency_level}
                          </span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create */}
        {modalMode === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={userForm.email || ''} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={userForm.full_name || ''} onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))} className="input-field" placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
              <select value={userForm.role || 'support_agent'} onChange={e => setUserForm(p => ({ ...p, role: e.target.value as UserRole }))} className="input-field">
                {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Inline Agent Skills (only for support_agent) */}
            {userForm.role === 'support_agent' && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" /> Agent Skills
                </h4>

                {/* List of added skills */}
                {createSkills.length > 0 && (
                  <div className="space-y-2">
                    {createSkills.map(skill => {
                      const areaName = areas.find(a => a.area_id === skill.area_id)?.name ?? `Area ${skill.area_id}`
                      const prof = PROFICIENCY_LEVELS.find(p => p.value === skill.proficiency_level)
                      return (
                        <div key={skill.area_id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{areaName}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${prof?.color || 'bg-gray-100 text-gray-700'}`}>
                              {prof?.label || skill.proficiency_level}
                            </span>
                          </div>
                          <button type="button" onClick={() => handleRemoveCreateSkill(skill.area_id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add new skill row */}
                {availableCreateAreas.length > 0 && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Area of Concern</label>
                      <select value={createNewSkill.area_id} onChange={e => setCreateNewSkill(p => ({ ...p, area_id: parseInt(e.target.value) }))} className="input-field text-sm">
                        <option value={0}>Select an area...</option>
                        {availableCreateAreas.map(a => <option key={a.area_id} value={a.area_id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Expertise</label>
                      <select value={createNewSkill.proficiency_level} onChange={e => setCreateNewSkill(p => ({ ...p, proficiency_level: e.target.value }))} className="input-field text-sm">
                        {PROFICIENCY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={handleAddCreateSkill} disabled={!createNewSkill.area_id} className="btn-secondary flex items-center gap-1 px-3 py-2 text-sm">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                )}

                {availableCreateAreas.length === 0 && createSkills.length > 0 && (
                  <p className="text-xs text-gray-500 italic">All available areas have been assigned.</p>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800"><strong>Note:</strong> A temporary password will be generated and displayed after creation. The user will be required to change it on first login.</p>
            </div>
          </div>
        )}

        {/* Edit */}
        {modalMode === 'edit' && selectedUser && (
          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Editing user: <span className="font-medium text-gray-900">{selectedUser.email}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={userForm.full_name || ''} onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))} className="input-field" placeholder="Enter full name" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="is_active" checked={userForm.is_active} onChange={e => setUserForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Account Active</label>
            </div>
          </div>
        )}

        {/* Skills */}
        {modalMode === 'skills' && selectedUser && (
          <div className="space-y-5">
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Managing skills for: <span className="font-medium text-gray-900">{selectedUser.full_name || selectedUser.email}</span></p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Skills</h4>
              {skillsLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : agentSkills.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No skills assigned yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agentSkills.map(skill => (
                    <div key={skill.area_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{skill.area_name}</p>
                        <select value={skill.proficiency_level} onChange={e => handleUpdateSkillProficiency(skill.area_id, e.target.value)} disabled={saving} className="text-xs mt-1 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                          {PROFICIENCY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                      <button onClick={() => handleRemoveSkill(skill.area_id)} disabled={saving} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {availableAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Skill</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Area</label>
                    <select value={newSkill.area_id} onChange={e => setNewSkill(p => ({ ...p, area_id: parseInt(e.target.value) }))} className="input-field">
                      <option value={0}>Select an area...</option>
                      {availableAreas.map(a => <option key={a.area_id} value={a.area_id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Proficiency Level</label>
                    <select value={newSkill.proficiency_level} onChange={e => setNewSkill(p => ({ ...p, proficiency_level: e.target.value }))} className="input-field">
                      {PROFICIENCY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddSkill} disabled={saving || !newSkill.area_id} className="btn-primary w-full flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Skill
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