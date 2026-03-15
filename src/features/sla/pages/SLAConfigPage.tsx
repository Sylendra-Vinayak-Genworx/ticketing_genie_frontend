import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { useSLA } from '@/features/sla/hooks/useSLA'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SeverityBadge, PriorityBadge } from '@/components/ui/Badge'
import { formatMinutes } from '@/utils'
import toast from 'react-hot-toast'
import type { SLA, SLARule } from '@/types'

export default function SLAConfigPage() {
  const { slas: fetchedSlas, isLoading } = useSLA()

  // Local working copy — SLA page does local-state CRUD (no backend write calls per original design)
  const [slas, setSlas] = useState<SLA[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [submitting] = useState(false)

  // Seed local state when fetched data arrives
  useEffect(() => {
    if (fetchedSlas.length > 0) {
      setSlas(fetchedSlas)
      setExpanded(new Set([fetchedSlas[0].sla_id]))
    }
  }, [fetchedSlas])

  const [editRule, setEditRule] = useState<SLARule | null>(null)
  const [editForm, setEditForm] = useState({ response_time_minutes: 0, resolution_time_minutes: 0, escalation_after_minutes: 0 })
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'sla' | 'rule'; id: number } | null>(null)
  const [addSlaModal, setAddSlaModal] = useState(false)
  const [newSlaForm, setNewSlaForm] = useState({ name: '', is_active: true })
  const [addRuleModal, setAddRuleModal] = useState<number | null>(null)
  const [newRuleForm, setNewRuleForm] = useState({ severity: 'LOW', priority: 'P3', response_time_minutes: 0, resolution_time_minutes: 0, escalation_after_minutes: 0 })

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openEditRule(rule: SLARule) {
    setEditRule(rule)
    setEditForm({
      response_time_minutes: rule.response_time_minutes,
      resolution_time_minutes: rule.resolution_time_minutes,
      escalation_after_minutes: rule.escalation_after_minutes,
    })
  }

  function handleSaveRule() {
    if (!editRule) return
    setSlas(prev => prev.map(s => ({
      ...s,
      rules: s.rules.map(r => r.rule_id === editRule.rule_id ? { ...r, ...editForm } : r)
    })))
    toast.success('Rule updated')
    setEditRule(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'sla') {
      setSlas(prev => prev.filter(s => s.sla_id !== deleteTarget.id))
      toast.success('SLA deleted')
    } else {
      setSlas(prev => prev.map(s => ({
        ...s,
        rules: s.rules.filter(r => r.rule_id !== deleteTarget.id)
      })))
      toast.success('Rule deleted')
    }
    setDeleteTarget(null)
  }

  function handleAddSlaSubmit() {
    if (!newSlaForm.name.trim()) { toast.error('Tier name is required'); return }
    const newSla: SLA = {
      sla_id: Date.now(),
      name: newSlaForm.name,
      customer_tier_id: Date.now() % 100000,
      is_active: newSlaForm.is_active,
      created_at: new Date().toISOString(),
      rules: []
    }
    setSlas(prev => [...prev, newSla])
    setAddSlaModal(false)
    setNewSlaForm({ name: '', is_active: true })
    toast.success('SLA Tier added')
  }

  function handleAddRuleSubmit() {
    if (addRuleModal === null) return
    const newRule: SLARule = {
      rule_id: Date.now(),
      sla_id: addRuleModal,
      severity: newRuleForm.severity as any,
      priority: newRuleForm.priority as any,
      response_time_minutes: newRuleForm.response_time_minutes,
      resolution_time_minutes: newRuleForm.resolution_time_minutes,
      escalation_after_minutes: newRuleForm.escalation_after_minutes
    }
    setSlas(prev => prev.map(s => s.sla_id === addRuleModal ? { ...s, rules: [...s.rules, newRule] } : s))
    setAddRuleModal(null)
    setNewRuleForm({ severity: 'LOW', priority: 'P3', response_time_minutes: 0, resolution_time_minutes: 0, escalation_after_minutes: 0 })
    toast.success('Rule added')
  }

  if (isLoading) return <LoadingSpinner fullPage text="Loading SLA config…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="SLA Configuration" subtitle="Configure response and resolution time targets" />
        <button onClick={() => setAddSlaModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add SLA Tier
        </button>
      </div>

      {slas.map(sla => (
        <div key={sla.sla_id} className="card overflow-hidden">
          <button
            onClick={() => toggleExpand(sla.sla_id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              {expanded.has(sla.sla_id) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <div>
                <p className="font-semibold text-gray-900">{sla.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Tier ID: {sla.customer_tier_id} · {sla.rules.length} rules</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${sla.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {sla.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'sla', id: sla.sla_id }) }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </button>

          {expanded.has(sla.sla_id) && (
            <div className="border-t border-gray-100">
              <div className="flex justify-end p-3 border-b border-gray-100 bg-gray-50/50">
                <button onClick={() => setAddRuleModal(sla.sla_id)} className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3 bg-white">
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Response</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Resolution</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Escalation</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sla.rules.map(rule => (
                      <tr key={rule.rule_id} className="table-row">
                        <td className="px-4 py-3"><SeverityBadge severity={rule.severity} /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={rule.priority} /></td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatMinutes(rule.response_time_minutes)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatMinutes(rule.resolution_time_minutes)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatMinutes(rule.escalation_after_minutes)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openEditRule(rule)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget({ type: 'rule', id: rule.rule_id })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}

      {slas.length === 0 && <div className="text-center py-16 text-gray-500">No SLA configurations found</div>}

      <Modal open={!!editRule} onClose={() => setEditRule(null)} title="Edit SLA Rule"
        footer={<><button onClick={() => setEditRule(null)} className="btn-secondary">Cancel</button><button onClick={handleSaveRule} disabled={submitting} className="btn-primary">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}</button></>}
      >
        {editRule && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-3"><SeverityBadge severity={editRule.severity} /><PriorityBadge priority={editRule.priority} /></div>
            {([['response_time_minutes','Response Time (minutes)'],['resolution_time_minutes','Resolution Time (minutes)'],['escalation_after_minutes','Escalation After (minutes)']] as const).map(([key,label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input type="number" min={1} value={editForm[key]} onChange={(e) => setEditForm(prev => ({ ...prev, [key]: Number(e.target.value) }))} className="input-field" />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'sla' ? 'SLA Tier' : 'Rule'}`}
        message="This action cannot be undone. Are you sure?" confirmLabel="Delete" isLoading={submitting} variant="danger" />

      <Modal open={addSlaModal} onClose={() => setAddSlaModal(false)} title="Add SLA Tier"
        footer={<><button onClick={() => setAddSlaModal(false)} className="btn-secondary">Cancel</button><button onClick={handleAddSlaSubmit} className="btn-primary">Add Tier</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier Name</label>
            <input type="text" value={newSlaForm.name} onChange={e => setNewSlaForm(prev => ({...prev, name: e.target.value}))} className="input-field" placeholder="e.g. Premium" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="sla-active" checked={newSlaForm.is_active} onChange={e => setNewSlaForm(prev => ({...prev, is_active: e.target.checked}))} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="sla-active" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>
      </Modal>

      <Modal open={addRuleModal !== null} onClose={() => setAddRuleModal(null)} title="Add SLA Rule"
        footer={<><button onClick={() => setAddRuleModal(null)} className="btn-secondary">Cancel</button><button onClick={handleAddRuleSubmit} className="btn-primary">Add Rule</button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
              <select value={newRuleForm.severity} onChange={e => setNewRuleForm(prev => ({ ...prev, severity: e.target.value }))} className="input-field">
                <option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={newRuleForm.priority} onChange={e => setNewRuleForm(prev => ({ ...prev, priority: e.target.value }))} className="input-field">
                <option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
              </select>
            </div>
          </div>
          {([['response_time_minutes','Response Time (minutes)'],['resolution_time_minutes','Resolution Time (minutes)'],['escalation_after_minutes','Escalation After (minutes)']] as const).map(([key,label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input type="number" min={0} value={newRuleForm[key]} onChange={e => setNewRuleForm(prev => ({ ...prev, [key]: Number(e.target.value) }))} className="input-field" />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
