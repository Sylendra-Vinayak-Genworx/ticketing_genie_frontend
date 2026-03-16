import { useState, useEffect } from 'react'
import { ticketService } from '../services/ticketService'
import { userService } from '@/features/users/services/userService'
import type { User } from '@/types'

interface UseTicketDetailMeta {
  assigneeName: string | null
  customerName: string | null
  areaName: string | null
  agents: User[]
  agentsLoading: boolean
}

/**
 * Resolves display names (assignee, customer, area) when a ticket changes,
 * and provides a loader for the agent list for the Assign modal.
 */
export function useTicketDetail() {
  const [meta, setMeta] = useState<UseTicketDetailMeta>({
    assigneeName: null,
    customerName: null,
    areaName: null,
    agents: [],
    agentsLoading: false,
  })

  const resolveNames = async (ticket: {
    ticket_id: number
    assignee_id?: string | null
    customer_id: string
    area_of_concern?: string | number | null
  }) => {
    // Resolve area name
    ticketService.getAreasOfConcern()
      .then(areas => {
        const match = areas.find(a => a.area_id === Number(ticket.area_of_concern))
        setMeta(m => ({ ...m, areaName: match?.name ?? null }))
      })
      .catch(() => setMeta(m => ({ ...m, areaName: null })))

    // Resolve assignee name
    if (ticket.assignee_id) {
      userService.getUserById(ticket.assignee_id)
        .then(u => setMeta(m => ({ ...m, assigneeName: u.full_name || u.email })))
        .catch(() => setMeta(m => ({ ...m, assigneeName: `Guest (${ticket.assignee_id!.slice(0, 8)})` })))
    } else {
      setMeta(m => ({ ...m, assigneeName: null }))
    }

    // Resolve customer name
    userService.getUserById(ticket.customer_id)
      .then(u => setMeta(m => ({ ...m, customerName: u.full_name || u.email })))
      .catch(() => setMeta(m => ({ ...m, customerName: `Guest (${ticket.customer_id.slice(0, 8)})` })))
  }

  const loadAgents = async (role: string, currentUserId: string, assigneeId?: string | null): Promise<void> => {
    setMeta(m => ({ ...m, agentsLoading: true, agents: [] }))
    try {
      const leadId = role === 'team_lead'
        ? currentUserId
        : assigneeId ?? null

      if (!leadId) {
        const all = await userService.getAllUsers()
        setMeta(m => ({ ...m, agents: all.filter(u => u.role === 'support_agent'), agentsLoading: false }))
        return
      }

      const teamAgents = await userService.getAgentsByLead(leadId)
      setMeta(m => ({ ...m, agents: teamAgents, agentsLoading: false }))
    } catch {
      setMeta(m => ({ ...m, agentsLoading: false }))
    }
  }

  return {
    ...meta,
    resolveNames,
    loadAgents,
  }
}
