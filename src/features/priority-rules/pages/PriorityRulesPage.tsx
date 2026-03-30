import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, SlidersHorizontal } from 'lucide-react'
import { usePriorityRules } from '@/features/priority-rules/hooks/usePriorityRules'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/common/LoadingSpinner'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SeverityBadge, PriorityBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import type { PriorityRule } from '@/features/priority-rules/types'
import type { Severity, Priority } from '@/types'
import { SEVERITIES, PRIORITIES } from '@/config/constants'

const DEFAULT_TIER_NAMES = ['FREE', 'STANDARD', 'ENTERPRISE']

const EMPTY_FORM = {
  severity: 'CRITICAL' as Severity,
  tier_name: 'STANDARD',
  priority: 'P0' as Priority,
}

const EDIT_FORM = { priority: 'P0' as Priority }

export default function PriorityRulesPage() {
  const {
    rules,
    isLoading,
    isSubmitting,
    createRule,
    updateRule,
    deleteRule,
  } = usePriorityRules()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PriorityRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [editPriority, setEditPriority] = useState<Priority>('P0')

  function openAdd() {
    setAddForm(EMPTY_FORM)
    setAddModalOpen(true)
  }

  function openEdit(rule: PriorityRule) {
    setEditTarget(rule)
    setEditPriority(rule.priority)
  }

  async function handleAdd() {
    const ok = await createRule(addForm)
    if (ok) {
      toast.success('Priority rule created')
      setAddModalOpen(false)
    } else {
      toast.error('Failed to create rule — possibly a duplicate')
    }
  }

  async function handleEdit() {
    if (!editTarget) return
    const ok = await updateRule(editTarget.rule_id, { priority: editPriority })
    if (ok) {
      toast.success('Priority updated')
      setEditTarget(null)
    } else {
      toast.error('Update failed')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const ok = await deleteRule(deleteTarget)
    if (ok) {
      toast.success('Rule deleted')
      setDeleteTarget(null)
    } else {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Priority Rules"
        subtitle="Map (severity × customer tier) → ticket priority"
        actions={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 skeleton rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rules.map(rule => (
                    <tr key={rule.rule_id} className="table-row">
                      <td className="px-4 py-3">
                        <SeverityBadge severity={rule.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 text-gray-700">{rule.tier_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={rule.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(rule)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit priority"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(rule.rule_id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {!isLoading && rules.length === 0 && (
          <EmptyState
            icon={<SlidersHorizontal className="w-10 h-10" />}
            title="No priority rules"
            description="Create rules to map severity × tier to a priority level"
            action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Rule</button>}
          />
        )}
      </div>

      {/* ── Add Rule Modal ─────────────────────────────────────────────── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Priority Rule"
        footer={
          <>
            <button onClick={() => setAddModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdd} disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Rule'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
              <select
                value={addForm.severity}
                onChange={e => setAddForm(f => ({ ...f, severity: e.target.value as Severity }))}
                className="input-field"
              >
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Tier</label>
              <select
                value={addForm.tier_name}
                onChange={e => setAddForm(f => ({ ...f, tier_name: e.target.value }))}
                className="input-field"
              >
                {DEFAULT_TIER_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={addForm.priority}
                onChange={e => setAddForm(f => ({ ...f, priority: e.target.value as Priority }))}
                className="input-field"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            The combination of severity + tier must be unique.
          </p>
        </div>
      </Modal>

      {/* ── Edit Priority Modal ────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Priority"
        footer={
          <>
            <button onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleEdit} disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Update'}
            </button>
          </>
        }
      >
        {editTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <SeverityBadge severity={editTarget.severity} />
              <span className="text-gray-400">×</span>
              <span className="badge bg-gray-100 text-gray-700">{editTarget.tier_name}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Priority</label>
              <select
                value={editPriority}
                onChange={e => setEditPriority(e.target.value as Priority)}
                className="input-field"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ─────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Priority Rule"
        message="This rule will be permanently deleted. Ticket classification will fall back to the default priority mapping. Continue?"
        confirmLabel="Delete"
        isLoading={isSubmitting}
        variant="danger"
      />
    </div>
  )
}
