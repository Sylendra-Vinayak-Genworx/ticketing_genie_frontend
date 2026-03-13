import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Send, Lock, RefreshCw, Loader2, UserCheck,
  MessageSquare, History, Info, Paperclip, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { Avatar } from '@/components/ui/Avatar'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { StatusStepper } from '@/components/common/StatusStepper'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDateTime, formatRelative } from '@/utils'
import { authService } from '@/features/auth/services/authService'
import { ticketService } from '@/features/tickets/services/ticketService'
import toast from 'react-hot-toast'
import type { TicketStatus, AddCommentRequest, User } from '@/types'

// Which statuses an agent can transition to from each current status
const ALLOWED_TRANSITIONS: Record<string, TicketStatus[]> = {
  NEW:          ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['OPEN'],
  OPEN:         ['IN_PROGRESS'],
  IN_PROGRESS:  ['ON_HOLD', 'RESOLVED'],
  ON_HOLD:      ['IN_PROGRESS'],
  RESOLVED:     ['CLOSED'],
  CLOSED:       ['OPEN'],
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentTicket, isLoadingDetail, isSubmitting, fetchById, updateStatus, addComment, assign } = useTickets()

  const role = user?.role || 'user'
  const isAgent = role === 'support_agent' || role === 'team_lead' || role === 'admin'

  // Comment form
  const [commentBody, setCommentBody]       = useState('')
  const [isInternal, setIsInternal]         = useState(false)
  const [triggersHold, setTriggersHold]     = useState(false)
  const [triggersResume, setTriggersResume] = useState(false)

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus]             = useState<TicketStatus>('IN_PROGRESS')
  const [statusComment, setStatusComment]     = useState('')

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigneeId, setAssigneeId]           = useState('')
  const [agents, setAgents]                   = useState<User[]>([])
  const [agentsLoading, setAgentsLoading]     = useState(false)

  // Confirm modals
  const [closeConfirm, setCloseConfirm]   = useState(false)
  const [reopenConfirm, setReopenConfirm] = useState(false)

  // Active tab
  const [tab, setTab] = useState<'conversation' | 'details' | 'timeline'>('conversation')

  // Resolved display names
  const [assigneeName, setAssigneeName] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [areaName, setAreaName]         = useState<string | null>(null)

  useEffect(() => {
    if (id) fetchById(Number(id))
  }, [id])

  // Resolve display names whenever the ticket changes
  useEffect(() => {
    if (!currentTicket) return

    // Area of concern
    ticketService.getAreasOfConcern()
      .then(areas => {
        const match = areas.find(a => a.area_id === Number(currentTicket.area_of_concern))
        setAreaName(match?.name ?? null)
      })
      .catch(() => setAreaName(null))

    // Assignee name
    if (currentTicket.assignee_id) {
      authService.getUserById(currentTicket.assignee_id)
        .then(u => setAssigneeName(u.full_name || u.email))
        .catch(() => setAssigneeName(`Guest (${currentTicket.assignee_id!.slice(0, 8)})`))
    } else {
      setAssigneeName(null)
    }

    // Customer name
    authService.getUserById(currentTicket.customer_id)
      .then(u => setCustomerName(u.full_name || u.email))
      .catch(() => setCustomerName(`Guest (${currentTicket.customer_id.slice(0, 8)})`))
  }, [currentTicket?.ticket_id])

  // When assign modal opens, fetch agents for the current lead
  async function openAssignModal() {
    setAssigneeId('')
    setAgents([])
    setAssignModalOpen(true)

    // Determine which lead_id to use:
    // - team_lead role: use their own id
    // - admin: use the ticket's current assignee lead, or fallback to all users
    const leadId = role === 'team_lead'
      ? user!.id
      : currentTicket?.assignee_id ?? null

    if (!leadId) {
      // Admin with no assignee yet — load all support agents from all users
      setAgentsLoading(true)
      try {
        const all = await authService.getAllUsers()
        setAgents(all.filter(u => u.role === 'support_agent'))
      } catch {
        toast.error('Failed to load agents')
      } finally {
        setAgentsLoading(false)
      }
      return
    }

    setAgentsLoading(true)
    try {
      const teamAgents = await authService.getAgentsByLead(leadId)
      setAgents(teamAgents)
    } catch {
      toast.error('Failed to load team agents')
    } finally {
      setAgentsLoading(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim() || !currentTicket) return

    const data: AddCommentRequest = {
      body: commentBody.trim(),
      is_internal: isInternal,
      triggers_hold: triggersHold,
      triggers_resume: triggersResume,
      ticket_id: currentTicket.ticket_id,
    }

    const result = await addComment(currentTicket.ticket_id, data)
    if ((result as any).payload?.comment_id) {
      toast.success('Comment added')
      setCommentBody('')
      setIsInternal(false)
      setTriggersHold(false)
      setTriggersResume(false)
    } else {
      toast.error((result as any).payload || 'Failed to add comment')
    }
  }

  async function handleStatusChange() {
    if (!currentTicket) return
    const result = await updateStatus(currentTicket.ticket_id, {
      new_status: newStatus,
      comment: statusComment || undefined,
    })
    if ((result as any).payload?.ticket_id || (result as any).type?.endsWith('/fulfilled')) {
      toast.success('Status updated')
      setStatusModalOpen(false)
      setStatusComment('')
      fetchById(currentTicket.ticket_id)
    } else {
      toast.error((result as any).payload || 'Failed to update status')
    }
  }

  async function handleAssign() {
    if (!currentTicket || !assigneeId) return
    const result = await assign(currentTicket.ticket_id, { assignee_id: assigneeId })
    if ((result as any).payload?.ticket_id || (result as any).type?.endsWith('/fulfilled')) {
      toast.success('Ticket assigned')
      setAssignModalOpen(false)
      setAssigneeId('')
      fetchById(currentTicket.ticket_id)
    } else {
      toast.error((result as any).payload || 'Failed to assign ticket')
    }
  }

  async function handleClose() {
    if (!currentTicket) return
    await updateStatus(currentTicket.ticket_id, { new_status: 'CLOSED' })
    toast.success('Ticket closed')
    fetchById(currentTicket.ticket_id)
  }

  async function handleReopen() {

    if (!currentTicket) return
    await updateStatus(currentTicket.ticket_id, { new_status: 'OPEN' })
    
    toast.success('Ticket reopened')
    fetchById(currentTicket.ticket_id)
  }

  if (isLoadingDetail) return <LoadingSpinner fullPage text="Loading ticket…" />
  if (!currentTicket) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Ticket not found</p>
      <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">Back to tickets</button>
    </div>
  )

  const t = currentTicket

  // Type-safe accessors for optional SLA timestamp fields
  const getInProgressAt = () => {
    return (t as any).in_progress_at || (t as any).first_response_at || null
  }

  const getResolvedAt = () => {
    return (t as any).resolved_at || null
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-blue-600 font-bold text-sm">{t.ticket_number}</span>
            <StatusBadge status={t.status} />
            <PriorityBadge priority={t.priority} />
            <SeverityBadge severity={t.severity} />
            {t.is_escalated && (
              <span className="badge bg-orange-100 text-orange-700">
                <AlertTriangle className="w-3 h-3" /> Escalated
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-gray-900 mt-2 max-w-2xl">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.product} · {t.environment} · Created {formatRelative(t.created_at)}
          </p>
        </div>

        {/* Action buttons and SLA indicators */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {/* SLA Met indicators - shown when ticket is RESOLVED or CLOSED */}

          <button onClick={() => fetchById(t.ticket_id)} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Agents: Change Status for all transitions EXCEPT RESOLVED→CLOSED and CLOSED→OPEN (those belong to the customer) */}
          {isAgent && (ALLOWED_TRANSITIONS[t.status] ?? []).filter(s => s !== 'CLOSED' && !(t.status === 'CLOSED')).length > 0 && (
            <button
              onClick={() => {
                const options = (ALLOWED_TRANSITIONS[t.status] ?? []).filter(s => s !== 'CLOSED' && !(t.status === 'CLOSED'))
                setNewStatus(options[0])
                setStatusModalOpen(true)
              }}
              className="btn-secondary"
            >
              Change Status
            </button>
          )}

          {(role === 'team_lead' || role === 'admin') && (
            <button onClick={openAssignModal} className="btn-secondary">
              <UserCheck className="w-4 h-4" /> Assign
            </button>
          )}

          {/* Customer only: Close when RESOLVED */}
          {!isAgent && t.status === 'RESOLVED' && (
            <button onClick={() => setCloseConfirm(true)} className="btn-danger">
              <Lock className="w-4 h-4" /> Close
            </button>
          )}

          {/* Customer only: Reopen when CLOSED */}
          {!isAgent && t.status === 'CLOSED' && (
            <button onClick={() => setReopenConfirm(true)} className="btn-secondary">
              <RefreshCw className="w-4 h-4" /> Reopen
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left / Main */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-0.5 border-b border-gray-200 overflow-x-auto">
            {[
              { key: 'details',      label: 'Details',      icon: Info },
              { key: 'timeline',     label: 'Timeline',     icon: History, count: t.events.length },
              { key: 'conversation', label: 'Conversation', icon: MessageSquare, count: t.comments.length },
            ].map(tab_ => (
              <button
                key={tab_.key}
                onClick={() => setTab(tab_.key as typeof tab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === tab_.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab_.icon className="w-4 h-4" />
                {tab_.label}
                {tab_.count !== undefined && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                    {tab_.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conversation tab */}
          {tab === 'conversation' && (
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{t.description}</p>
              </div>

              {t.comments.length > 0 && (
                <div className="space-y-3">
                  {t.comments.map((comment) => (
                    <div
                      key={comment.comment_id}
                      className={`card p-4 ${comment.is_internal ? 'border-yellow-200 bg-yellow-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={comment.author_id} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{comment.author_id.slice(0, 12)}…</span>
                            <span className="text-xs text-gray-400">{comment.author_role.replace('_', ' ')}</span>
                            {comment.is_internal && <span className="badge bg-yellow-100 text-yellow-700">Internal Note</span>}
                            {comment.triggers_hold && <span className="badge bg-gray-100 text-gray-700">⏸ Paused SLA</span>}
                            {comment.triggers_resume && <span className="badge bg-green-100 text-green-700">▶ Resumed SLA</span>}
                            <span className="text-xs text-gray-400 ml-auto">{formatRelative(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{comment.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddComment} className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar name={user?.email || ''} size="sm" />
                  <span className="text-sm font-medium text-gray-700">Add Reply</span>
                </div>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write your reply…"
                  rows={4}
                  className="input-field resize-y"
                />
                {isAgent && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="text-blue-600 rounded" />
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">Internal note</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={triggersHold} onChange={(e) => { setTriggersHold(e.target.checked); if (e.target.checked) setTriggersResume(false) }} className="text-yellow-600 rounded" />
                      <span className="text-gray-600">Put On Hold</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={triggersResume} onChange={(e) => { setTriggersResume(e.target.checked); if (e.target.checked) setTriggersHold(false) }} className="text-green-600 rounded" />
                      <span className="text-gray-600">Resume SLA</span>
                    </label>
                  </div>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={isSubmitting || !commentBody.trim()} className="btn-primary">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Sending…' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Details tab */}
          {tab === 'details' && (
            <div className="card p-5 space-y-5">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Ticket ID',       value: t.ticket_number },
                  { label: 'Title',           value: t.title },
                  { label: 'Description',     value: t.description },
                  { label: 'Source',          value: (t.source as string) === 'ui' ? 'Manual Assignment' : 'Email Assignment' },
                  { label: 'Environment',     value: t.environment },
                  { label: 'Status',          value: t.status.replace(/_/g, ' ') },
                  { label: 'Issue Type',      value: areaName ?? (t.area_of_concern ? `Area ${t.area_of_concern}` : '—') },
                  { label: 'Priority',        value: t.priority },
                  { label: 'Severity',        value: t.severity },
                  { label: 'Customer',        value: customerName ?? `Guest (${t.customer_id.slice(0, 8)})` },
                  { label: 'Assignee',        value: assigneeName ?? (t.assignee_id ? `Guest (${t.assignee_id.slice(0, 8)})` : 'Unassigned') },
                  { label: 'Created',         value: formatDateTime(t.created_at) },
                  { label: 'Updated',         value: formatDateTime(t.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} className={label === 'Description' ? 'col-span-2' : ''}>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</dt>
                    <dd className={`text-gray-800 font-medium ${label === 'Description' ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
                  </div>
                ))}
              </dl>

              {/* SLA Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Response SLA</p>
                  <SLATimer 
                    dueAt={t.response_due_at} 
                    createdAt={t.created_at} 
                    status={t.status} 
                    label="Response SLA Met"
                    slaType="response"
                    firstResponseAt={getInProgressAt()}
                    isBreached={t.is_breached}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Resolution SLA</p>
                  <SLATimer 
                    dueAt={t.resolution_due_at} 
                    createdAt={t.created_at} 
                    status={t.status} 
                    label="Resolution SLA Met"
                    slaType="resolution"
                    resolvedAt={getResolvedAt()}
                    isBreached={t.is_breached}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Timeline tab */}
          {tab === 'timeline' && (
            <div className="card p-5">
              <StatusStepper events={t.events} />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {t.attachments.length > 0 && (
            <div className="card p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-gray-900">Attachments ({t.attachments.length})</h3>
              {t.attachments.map(att => (
                <a key={att.attachment_id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                  <Paperclip className="w-3.5 h-3.5" />
                  {att.file_name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Change Modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Change Status"
        footer={
          <>
            <button onClick={() => setStatusModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStatusChange} disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Updating…' : 'Update Status'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as TicketStatus)} className="input-field">
              {(ALLOWED_TRANSITIONS[t.status] ?? [])
                .filter(s => s !== 'CLOSED' && t.status !== 'CLOSED')
                .map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
            </select>
            {(ALLOWED_TRANSITIONS[t.status] ?? []).length === 0 && (
              <p className="text-sm text-gray-400 mt-1">No transitions available from current status.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
            <textarea value={statusComment} onChange={(e) => setStatusComment(e.target.value)} rows={3} className="input-field resize-none" placeholder="Explain why the status is changing…" />
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Ticket"
        footer={
          <>
            <button onClick={() => setAssignModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssign} disabled={isSubmitting || !assigneeId} className="btn-primary">
              {isSubmitting ? 'Assigning…' : 'Assign'}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Agent
          </label>

          {agentsLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading agents…
            </div>
          ) : agents.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">
              No agents found for this team.
            </p>
          ) : (
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="input-field"
            >
              <option value="">Select an agent…</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name
                    ? `${agent.full_name} (${agent.email})`
                    : agent.email
                  }
                </option>
              ))}
            </select>
          )}

          <p className="text-xs text-gray-400 mt-1">
            {role === 'team_lead'
              ? 'Showing agents from your team.'
              : 'Showing all available support agents.'
            }
          </p>
        </div>
      </Modal>

      <ConfirmModal
        open={closeConfirm}
        onClose={() => setCloseConfirm(false)}
        onConfirm={handleClose}
        title="Close Ticket"
        message="Are you sure you want to close this ticket? This action should only be done when the issue is fully resolved."
        confirmLabel="Close Ticket"
        variant="danger"
      />

      <ConfirmModal
        open={reopenConfirm}
        onClose={() => setReopenConfirm(false)}
        onConfirm={handleReopen}
        title="Reopen Ticket"
        message="Reopen this ticket and set it back to active status?"
        confirmLabel="Reopen"
        variant="info"
      />
    </div>
  )
}