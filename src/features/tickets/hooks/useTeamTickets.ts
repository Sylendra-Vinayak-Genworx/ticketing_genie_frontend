import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { ticketService } from '../services/ticketService'
import { userService } from '@/features/users/services/userService'
import type { TicketBrief, TicketStatus, Severity, Priority } from '@/types'

export interface TeamTicketFilters {
  status: TicketStatus | ''
  severity: Severity | ''
  priority: Priority | ''
  search: string
  quickFilter: 'all' | 'unassigned' | 'escalated'
}

const PAGE_SIZE = 20

export function useTeamTickets() {
  const { user } = useAuth()
  const teamId = (user as any)?.team_id as string | undefined

  const [tickets, setTickets] = useState<TicketBrief[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [nameCache, setNameCache] = useState<Record<string, string>>({})
  const [filters, setFilters] = useState<TeamTicketFilters>({
    status: '', severity: '', priority: '', search: '', quickFilter: 'all',
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    setTickets([])
    try {
      const res = await ticketService.getAllTickets({
        page, page_size: PAGE_SIZE,
        ...(teamId                               && { team_id:       teamId }),
        ...(filters.status                       && { status:        filters.status }),
        ...(filters.severity                     && { severity:      filters.severity }),
        ...(filters.priority                     && { priority:      filters.priority }),
        ...(filters.quickFilter === 'unassigned' && { is_unassigned: true }),
        ...(filters.quickFilter === 'escalated'  && { is_escalated:  true }),
      })
      setTickets(res.items)
      setTotal(res.total)

      // Resolve assignee names
      const unknownIds = [...new Set(
        res.items.map(t => t.assignee_id).filter((id): id is string => !!id)
      )]
      if (unknownIds.length > 0) {
        setNameCache(prev => {
          const missing = unknownIds.filter(id => !prev[id])
          if (missing.length === 0) return prev
          missing.forEach(id => {
            userService.getUserById(id)
              .then(u => setNameCache(c => ({ ...c, [id]: u.full_name || u.email })))
              .catch(() => setNameCache(c => ({ ...c, [id]: id.slice(0, 8) + '…' })))
          })
          return prev
        })
      }
    } catch (err) {
      console.error('useTeamTickets load error', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, filters.status, filters.severity, filters.priority, filters.quickFilter, teamId])

  useEffect(() => { load() }, [load])

  const resolveAssigneeName = (assigneeId: string | null | undefined): void => {
    if (!assigneeId || nameCache[assigneeId]) return
    userService.getUserById(assigneeId)
      .then(u => setNameCache(c => ({ ...c, [assigneeId]: u.full_name || u.email })))
      .catch(() => {})
  }

  const displayed = filters.search
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(filters.search.toLowerCase()))
    : tickets

  return {
    tickets: displayed,
    total, page, setPage, isLoading,
    nameCache, resolveAssigneeName,
    filters, setFilters,
    refetch: load,
  }
}
