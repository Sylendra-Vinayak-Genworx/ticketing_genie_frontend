import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/features/auth'
import { useTickets } from './useTickets'
import { useTicketDetail } from './useTicketDetail'
import { authService } from '@/features/auth/services/authService'
import { ticketService } from '../services/ticketService'
import toast from 'react-hot-toast'
import type { TicketStatus, AddCommentRequest } from '@/types'

const ALLOWED_TRANSITIONS: Record<string, TicketStatus[]> = {
  NEW:          ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['OPEN'],
  OPEN:         ['IN_PROGRESS'],
  IN_PROGRESS:  ['ON_HOLD', 'RESOLVED'],
  ON_HOLD:      ['IN_PROGRESS'],
  RESOLVED:     ['CLOSED'],
  CLOSED:       ['OPEN'],
}

export function useTicketDetailPage(ticketId: number | undefined) {
  const { user } = useAuth()
  const {
    currentTicket, isLoadingDetail, isSubmitting,
    fetchById, updateStatus, addComment, assign,
  } = useTickets()
  const {
    assigneeName, customerName, areaName,
    agents, agentsLoading,
    resolveNames, loadAgents,
  } = useTicketDetail()

  const role = user?.role || 'user'
  const isAgent = role === 'support_agent'

  // Comment form
  const [commentBody, setCommentBody]       = useState('')
  const [isInternal, setIsInternal]         = useState(false)
  const [triggersHold, setTriggersHold]     = useState(false)
  const [triggersResume, setTriggersResume] = useState(false)
  const [selfEscalate, setSelfEscalate]     = useState(false)

  // Comment image attachments
  const [commentImages, setCommentImages]         = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const commentImageInputRef                      = useRef<HTMLInputElement>(null)

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus]             = useState<TicketStatus>('IN_PROGRESS')
  const [statusComment, setStatusComment]     = useState('')

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigneeId, setAssigneeId]           = useState('')

  // Confirm modals
  const [closeConfirm, setCloseConfirm]   = useState(false)
  const [reopenConfirm, setReopenConfirm] = useState(false)

  // Active tab
  const [tab, setTab] = useState<'conversation' | 'details' | 'timeline'>('details')

  // Timeline user name resolution
  const [eventUserNames, setEventUserNames] = useState<Record<string, string>>({})

  // Fetch ticket on mount / id change
  useEffect(() => {
    if (ticketId) fetchById(ticketId)
  }, [ticketId])

  // Resolve all display names whenever the ticket changes
  useEffect(() => {
    if (!currentTicket) return

    resolveNames({
      ticket_id: currentTicket.ticket_id,
      assignee_id: currentTicket.assignee_id,
      customer_id: currentTicket.customer_id,
      area_of_concern: currentTicket.area_of_concern,
    })

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const actorIds = [
      ...new Set([
        ...currentTicket.events
          .map((e: any) => e.triggered_by_user_id)
          .filter((id: any): id is string => !!id),
        ...currentTicket.events
          .filter((e: any) => e.event_type === 'ASSIGNED')
          .flatMap((e: any) => [e.new_value, e.old_value])
          .filter((v: any): v is string => !!v && UUID_RE.test(v)),
        ...currentTicket.comments
          .map((c: any) => c.author_id)
          .filter((id: any): id is string => !!id && UUID_RE.test(id)),
      ]),
    ]
    if (actorIds.length > 0) {
      const nameMap: Record<string, string> = {}
      Promise.all(
        actorIds.map(uid =>
          authService.getUserById(uid)
            .then(u => { nameMap[uid] = u.full_name || u.email })
            .catch(() => { nameMap[uid] = uid.slice(0, 8) + '…' })
        )
      ).then(() => setEventUserNames(nameMap))
    }
  }, [currentTicket?.ticket_id, currentTicket?.events?.length, currentTicket?.comments?.length])

  const openAssignModal = useCallback(() => {
    setAssigneeId('')
    setAssignModalOpen(true)
    if (user) {
      loadAgents(role, user.id, currentTicket?.assignee_id)
    }
  }, [role, user, currentTicket?.assignee_id, loadAgents])

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim() || !currentTicket) return

    // Upload any staged images first
    let blobPaths: string[] = []
    if (commentImages.length > 0) {
      setIsUploadingImages(true)
      try {
        const uploads = await Promise.all(
          commentImages.map(f => ticketService.uploadCommentAttachment(f))
        )
        blobPaths = uploads.map(u => u.blob_path)
      } catch {
        toast.error('Image upload failed. Please try again.')
        setIsUploadingImages(false)
        return
      }
      setIsUploadingImages(false)
    }

    const data: AddCommentRequest = {
      body: commentBody.trim(),
      is_internal: isInternal,
      triggers_hold: triggersHold,
      triggers_resume: triggersResume,
      ticket_id: currentTicket.ticket_id,
      attachments: blobPaths,
    }

    const result = await addComment(currentTicket.ticket_id, data)
    if ((result as any).payload?.comment_id) {
      // If self-escalate is checked, call the escalate endpoint after the comment
      if (selfEscalate) {
        try {
          await ticketService.selfEscalate(
            currentTicket.ticket_id,
            `Escalated by agent with comment: ${commentBody.trim().slice(0, 120)}`,
          )
          toast.success('Comment added and ticket escalated')
        } catch (err: any) {
          toast.error(err?.response?.data?.detail || 'Comment sent but escalation failed')
        }
      } else {
        toast.success('Comment added')
      }
      setCommentBody('')
      setIsInternal(false)
      setTriggersHold(false)
      setTriggersResume(false)
      setSelfEscalate(false)
      setCommentImages([])
      fetchById(currentTicket.ticket_id)
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
    setCloseConfirm(false)
    toast.success('Ticket closed')
    fetchById(currentTicket.ticket_id)
  }

  async function handleReopen() {
    if (!currentTicket) return
    await updateStatus(currentTicket.ticket_id, { new_status: 'OPEN' })
    setReopenConfirm(false)
    toast.success('Ticket reopened')
    fetchById(currentTicket.ticket_id)
  }

  const openStatusModal = useCallback(() => {
    if (!currentTicket) return
    const options = (ALLOWED_TRANSITIONS[currentTicket.status] ?? []).filter(s => s !== 'CLOSED' && !(currentTicket.status === 'CLOSED'))
    if (options.length > 0) {
      setNewStatus(options[0])
      setStatusModalOpen(true)
    }
  }, [currentTicket?.status])

  const allowedTransitions = currentTicket ? (ALLOWED_TRANSITIONS[currentTicket.status] ?? []) : []
  const statusOptions = allowedTransitions.filter(s => s !== 'CLOSED' && currentTicket?.status !== 'CLOSED')

  return {
    // Ticket data
    currentTicket, isLoadingDetail, isSubmitting,
    fetchById,

    // User info
    user, role, isAgent,

    // Display names
    assigneeName, customerName, areaName, eventUserNames,

    // Tab
    tab, setTab,

    // Comment form
    commentBody, setCommentBody,
    isInternal, setIsInternal,
    triggersHold, setTriggersHold,
    triggersResume, setTriggersResume,
    selfEscalate, setSelfEscalate,
    handleAddComment,
    commentImages, setCommentImages,
    isUploadingImages,
    commentImageInputRef,

    // Status modal
    statusModalOpen, setStatusModalOpen,
    newStatus, setNewStatus,
    statusComment, setStatusComment,
    statusOptions, allowedTransitions,
    openStatusModal, handleStatusChange,

    // Assign modal
    assignModalOpen, setAssignModalOpen,
    assigneeId, setAssigneeId,
    agents, agentsLoading,
    openAssignModal, handleAssign,

    // Confirm modals
    closeConfirm, setCloseConfirm, handleClose,
    reopenConfirm, setReopenConfirm, handleReopen,
  }
}