import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { slaService } from '@/features/sla/services/slaService'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SeverityBadge, PriorityBadge } from '@/components/ui/Badge'
import { formatMinutes } from '@/utils'
import toast from 'react-hot-toast'
import type { SLA, SLARule } from '@/types'

export default function SLAConfigPage() {
  const [slas, setSlas] = useState<SLA[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  // Edit rule modal
  const [editRule, setEditRule] = useState<SLARule | null>(null)
  const [editForm, setEditForm] = useState({ response_time_minutes: 0, resolution_time_minutes: 0, escalation_after_minutes: 0 })

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'sla' | 'rule'; id: number } | null>(null)

  async function load() {
    try {
      const data = await slaService.listSLAs({ page: 1, page_size: 50 })
      setSlas(data.items)
      if (data.items.length > 0) setExpanded(new Set([data.items[0].sla_id]))
    } catch {
      toast.error('Failed to load SLA rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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

  async function handleSaveRule() {
    if (!editRule) return
    setSubmitting(true)
    try {
      await slaService.updateRule(editRule.rule_id, editForm)
      toast.success('Rule updated')
      setEditRule(null)
      load()
    } catch {
      toast.error('Failed to update rule')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      if (deleteTarget.type === 'sla') {
        await slaService.deleteSLA(deleteTarget.id)
        toast.success('SLA deleted')
      } else {
        await slaService.deleteRule(deleteTarget.id)
        toast.success('Rule deleted')
      }
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Delete failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage text="Loading SLA config…" />

  return (
    <div className="space-y-5">
      <PageHeader title="SLA Configuration" subtitle="Configure response and resolution time targets" />

      {slas.map(sla => (
        <div key={sla.sla_id} className="card overflow-hidden">
          {/* SLA Header */}
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

          {/* Rules Table */}
          {expanded.has(sla.sla_id) && (
            <div className="border-t border-gray-100">
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

      {slas.length === 0 && (
        <div className="text-center py-16 text-gray-500">No SLA configurations found</div>
      )}

      {/* Edit Rule Modal */}
      <Modal
        open={!!editRule}
        onClose={() => setEditRule(null)}
        title="Edit SLA Rule"
        footer={
          <>
            <button onClick={() => setEditRule(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveRule} disabled={submitting} className="btn-primary">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          </>
        }
      >
        {editRule && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-3">
              <SeverityBadge severity={editRule.severity} />
              <PriorityBadge priority={editRule.priority} />
            </div>
            {[
              { key: 'response_time_minutes' as const, label: 'Response Time (minutes)' },
              { key: 'resolution_time_minutes' as const, label: 'Resolution Time (minutes)' },
              { key: 'escalation_after_minutes' as const, label: 'Escalation After (minutes)' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                <input
                  type="number"
                  min={1}
                  value={editForm[f.key]}
                  onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  className="input-field"
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'sla' ? 'SLA' : 'Rule'}`}
        message="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
