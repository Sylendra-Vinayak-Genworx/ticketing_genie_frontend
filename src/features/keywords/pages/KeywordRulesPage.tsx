import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react'
import { useKeywords } from '@/features/keywords/hooks/useKeywords'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/common/LoadingSpinner'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SeverityBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/common/Pagination'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'
import type { KeywordRule, MatchField, Severity } from '@/types'
import { SEVERITIES, MATCH_FIELDS } from '@/config/constants'

const EMPTY_FORM = { keyword: '', match_field: 'BOTH' as MatchField, target_severity: 'HIGH' as Severity, is_active: true }

export default function KeywordRulesPage() {
  const {
    rules, total, page, setPage,
    isLoading, isSubmitting,
    createRule, updateRule, deleteRule, toggleActive,
  } = useKeywords()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<KeywordRule | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(rule: KeywordRule) {
    setEditTarget(rule)
    setForm({
      keyword: rule.keyword,
      match_field: rule.match_field,
      target_severity: rule.target_severity,
      is_active: rule.is_active,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.keyword.trim()) { toast.error('Keyword is required'); return }
    let ok: boolean
    if (editTarget) {
      ok = await updateRule(editTarget.keyword_rule_id, form)
      if (ok) toast.success('Rule updated')
      else toast.error('Operation failed')
    } else {
      ok = await createRule(form)
      if (ok) toast.success('Rule created')
      else toast.error('Operation failed')
    }
    if (ok) setModalOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const ok = await deleteRule(deleteTarget)
    if (ok) { toast.success('Rule deleted'); setDeleteTarget(null) }
    else toast.error('Delete failed')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Keyword Rules"
        subtitle="Auto-set ticket severity based on keywords"
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Match Field</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Target Severity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                : rules.map(rule => (
                    <tr key={rule.keyword_rule_id} className="table-row">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-medium text-gray-900">
                          <Tag className="w-3.5 h-3.5 text-blue-500" />
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{rule.keyword}</code>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 text-gray-700">{rule.match_field}</span>
                      </td>
                      <td className="px-4 py-3"><SeverityBadge severity={rule.target_severity} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(rule)} className={`badge cursor-pointer transition-colors ${rule.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(rule.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(rule)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(rule.keyword_rule_id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
            icon={<Tag className="w-10 h-10" />}
            title="No keyword rules"
            description="Create rules to automatically set ticket severity"
            action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Rule</button>}
          />
        )}

        {!isLoading && rules.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination total={total} page={page} pageSize={20} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Keyword Rule' : 'Add Keyword Rule'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Rule'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Keyword <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.keyword}
              onChange={(e) => setForm(f => ({ ...f, keyword: e.target.value }))}
              className="input-field"
              placeholder="e.g. payment failed"
              maxLength={255}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Match Field</label>
              <select value={form.match_field} onChange={(e) => setForm(f => ({ ...f, match_field: e.target.value as MatchField }))} className="input-field">
                {MATCH_FIELDS.map(mf => <option key={mf} value={mf}>{mf}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Severity</label>
              <select value={form.target_severity} onChange={(e) => setForm(f => ({ ...f, target_severity: e.target.value as Severity }))} className="input-field">
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded text-blue-600" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Keyword Rule"
        message="This rule will be permanently deleted. Continue?"
        confirmLabel="Delete"
        isLoading={isSubmitting}
        variant="danger"
      />
    </div>
  )
}
