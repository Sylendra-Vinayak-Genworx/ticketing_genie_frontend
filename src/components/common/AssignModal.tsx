import React, { useEffect, useState } from 'react'
import { UserCheck, Loader2, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { authService } from '@/features/auth/services/authService'
import { ticketService } from '@/features/tickets/services/ticketService'
import type { User, TicketBrief } from '@/types'

interface AssignModalProps {
  ticket: TicketBrief | null
  currentAssigneeName?: string | null
  onClose: () => void
  onAssigned: (updated: TicketBrief) => void
}

export function AssignModal({ ticket, currentAssigneeName, onClose, onAssigned }: AssignModalProps) {
  const [agents,   setAgents]   = useState<User[]>([])
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving,  setIsSaving]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const isReassign = !!ticket?.assignee_id

  useEffect(() => {
    if (!ticket) return
    setSearch('')
    setSelected('')
    setError(null)
    setIsLoading(true)
    authService.getAllUsers()
      .then(users => setAgents(users.filter(u => u.role === 'support_agent' && u.is_active)))
      .catch(() => setError('Failed to load agents'))
      .finally(() => setIsLoading(false))
  }, [ticket])

  const filtered = search
    ? agents.filter(a =>
        (a.full_name ?? a.email).toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()))
    : agents

  async function handleAssign() {
    if (!ticket || !selected) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await ticketService.assignTicket(ticket.ticket_id, { assignee_id: selected })
      onAssigned(updated)
      onClose()
    } catch {
      setError('Failed to assign ticket. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={!!ticket}
      onClose={onClose}
      title={isReassign ? `Reassign ${ticket?.ticket_number}` : `Assign ${ticket?.ticket_number}`}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>Cancel</button>
          <button onClick={handleAssign} disabled={!selected || isSaving} className="btn-primary">
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><UserCheck className="w-4 h-4" /> {isReassign ? 'Reassign' : 'Assign'}</>}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {ticket && (
          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <span className="font-medium text-gray-800">{ticket.title}</span>
            {isReassign && (
              <p className="text-xs text-amber-600 mt-0.5">
                Currently: <span className="font-medium">{currentAssigneeName ?? `${ticket.assignee_id?.slice(0, 8)}…`}</span>
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search agents…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg">
          {isLoading
            ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
            : filtered.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No agents found</p>
              : filtered.map(agent => (
                <button key={agent.id} type="button" onClick={() => setSelected(agent.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selected === agent.id
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}>
                  <span className="font-medium">{agent.full_name ?? agent.email}</span>
                  {agent.full_name && (
                    <span className="ml-2 text-xs text-gray-400">{agent.email}</span>
                  )}
                </button>
              ))
          }
        </div>
      </div>
    </Modal>
  )
}