import React, { useState } from 'react'
import {
  Plus, Trash2, Loader2, Users, UserPlus,
  ChevronDown, ChevronRight, Mail, Crown, UserMinus,
} from 'lucide-react'
import { useTeams } from '@/features/users/hooks/useTeams'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/common/LoadingSpinner'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import type { Team, User } from '@/types'

const EMPTY_TEAM_FORM = {
  name: '',
  description: '',
  lead_id: '',
  member_ids: [] as string[],
}

function TeamCard({
  team, allUsers, onDelete, onAddMember, onRemoveMember,
}: {
  team: Team
  allUsers: User[]
  onDelete: (t: Team) => void
  onAddMember: (t: Team) => void
  onRemoveMember: (t: Team, uid: string, name: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const lead = allUsers.find((u) => u.id === team.lead_id)

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 truncate">{team.name}</p>
            <span className="badge bg-gray-100 text-gray-600 text-xs">
              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </span>
          </div>
          {team.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{team.description}</p>
          )}
          {lead && (
            <div className="flex items-center gap-1.5 mt-1">
              <Crown className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-gray-500">{lead.full_name || lead.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onAddMember(team) }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Add member"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(team) }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete team"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />
          }
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">
          {team.members.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No members yet.</p>
              <button onClick={() => onAddMember(team)} className="btn-primary mt-3 text-xs px-3 py-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Add First Member
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Member</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {team.members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {m.id === team.lead_id && (
                          <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        )}
                        <Avatar name={m.full_name || m.email} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{m.full_name || m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={m.role} /></td>
                    <td className="px-5 py-3">
                      <span className={`badge ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onRemoveMember(team, m.id, m.full_name || m.email)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove from team"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default function TeamsPage() {
  const { teams, allUsers, isLoading, isSubmitting, createTeam, deleteTeam, addMember, removeMember } = useTeams()

  const [createOpen, setCreateOpen] = useState(false)
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM)
  const [addMemberTarget, setAddMemberTarget] = useState<Team | null>(null)
  const [memberForm, setMemberForm] = useState<{ user_id: string }>({ user_id: '' })
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<Team | null>(null)
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ team: Team; userId: string; name: string } | null>(null)

  const eligibleUsers = allUsers.filter(u => u.role === 'support_agent' || u.role === 'team_lead')

  function openCreate() { setTeamForm({ ...EMPTY_TEAM_FORM }); setCreateOpen(true) }

  function toggleMemberSelection(userId: string) {
    setTeamForm(f => {
      const isSelected = f.member_ids.includes(userId)
      return isSelected
        ? { ...f, member_ids: f.member_ids.filter(id => id !== userId) }
        : { ...f, member_ids: [...f.member_ids, userId] }
    })
  }

  async function handleCreateTeam() {
    if (!teamForm.name.trim()) return
    if (!teamForm.lead_id) return
    const ok = await createTeam({
      name: teamForm.name.trim(),
      description: teamForm.description.trim() || undefined,
      lead_id: teamForm.lead_id,
      member_ids: Array.from(new Set([...teamForm.member_ids, teamForm.lead_id])),
    })
    if (ok) setCreateOpen(false)
  }

  function openAddMember(team: Team) { setAddMemberTarget(team); setMemberForm({ user_id: '' }) }

  async function handleAddMember() {
    if (!addMemberTarget || !memberForm.user_id) return
    const ok = await addMember(addMemberTarget.id, memberForm)
    if (ok) setAddMemberTarget(null)
  }

  async function handleDeleteTeam() {
    if (!deleteTeamTarget) return
    const ok = await deleteTeam(deleteTeamTarget)
    if (ok) setDeleteTeamTarget(null)
  }

  async function handleRemoveMember() {
    if (!removeMemberTarget) return
    const ok = await removeMember(removeMemberTarget.team.id, removeMemberTarget.userId, removeMemberTarget.name)
    if (ok) setRemoveMemberTarget(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team Management"
        subtitle="Create teams, add members and send invite emails"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> New Team
          </button>
        }
      />

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : teams.length === 0 ? (
        <div className="card p-0 overflow-hidden">
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No teams yet"
            description="Create your first team and bulk-invite members"
            action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> New Team</button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              allUsers={allUsers}
              onDelete={setDeleteTeamTarget}
              onAddMember={openAddMember}
              onRemoveMember={(t, uid, name) => setRemoveMemberTarget({ team: t, userId: uid, name })}
            />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Team" size="xl"
        footer={<><button onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleCreateTeam} disabled={isSubmitting} className="btn-primary">{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Team</>}</button></>}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Name <span className="text-red-500">*</span></label>
              <input type="text" value={teamForm.name} onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g. Billing Support" maxLength={255} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <input type="text" value={teamForm.description} onChange={(e) => setTeamForm((f) => ({ ...f, description: e.target.value }))} className="input-field" placeholder="Optional" />
            </div>
          </div>
          <div>
            <div className="mb-2">
              <label className="text-sm font-medium text-gray-700">Team Lead <span className="text-red-500">*</span></label>
              <select value={teamForm.lead_id} onChange={(e) => setTeamForm(f => ({ ...f, lead_id: e.target.value }))} className="input-field mt-1">
                <option value="">Select a lead...</option>
                {eligibleUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Team Members</label>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Select agents to add to the team. The selected lead will be added automatically.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                {eligibleUsers.filter(u => u.id !== teamForm.lead_id).map((u) => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                    <input type="checkbox" checked={teamForm.member_ids.includes(u.id)} onChange={() => toggleMemberSelection(u.id)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <div className="flex items-center gap-2">
                      <Avatar name={u.full_name || u.email} size="sm" />
                      <div className="text-sm font-medium text-gray-900">{u.full_name || u.email}</div>
                      <RoleBadge role={u.role} />
                    </div>
                  </label>
                ))}
                {eligibleUsers.filter(u => u.id !== teamForm.lead_id).length === 0 && <div className="text-sm text-gray-500 text-center py-4">No other agents available.</div>}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={!!addMemberTarget} onClose={() => setAddMemberTarget(null)} title={`Add Member — ${addMemberTarget?.name}`} size="sm"
        footer={<><button onClick={() => setAddMemberTarget(null)} className="btn-secondary">Cancel</button><button onClick={handleAddMember} disabled={isSubmitting} className="btn-primary">{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : <><UserPlus className="w-4 h-4" /> Add & Send Invite</>}</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Agent <span className="text-red-500">*</span></label>
            <select value={memberForm.user_id} onChange={(e) => setMemberForm({ user_id: e.target.value })} className="input-field mt-1">
              <option value="">Choose an agent...</option>
              {allUsers.filter(u => (u.role === 'support_agent' || u.role === 'team_lead') && !addMemberTarget?.members.find(m => m.id === u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            The agent will be assigned to <strong>{addMemberTarget?.name}</strong>.
          </p>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTeamTarget} onClose={() => setDeleteTeamTarget(null)} onConfirm={handleDeleteTeam}
        title="Delete Team" message={`Delete "${deleteTeamTarget?.name}"? Members will be unassigned but their accounts will remain active.`}
        confirmLabel="Delete Team" isLoading={isSubmitting} variant="danger" />

      <ConfirmModal open={!!removeMemberTarget} onClose={() => setRemoveMemberTarget(null)} onConfirm={handleRemoveMember}
        title="Remove Member" message={`Remove ${removeMemberTarget?.name} from the team? Their account will remain active.`}
        confirmLabel="Remove" isLoading={isSubmitting} variant="danger" />
    </div>
  )
}
