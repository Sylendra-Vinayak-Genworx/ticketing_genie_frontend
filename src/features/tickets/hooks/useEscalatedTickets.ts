import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { ticketService } from '../services/ticketService'
import type { TicketBrief, TicketStatus, Severity, Priority } from '@/types'

export interface EscalatedTicketFilters {
  status: TicketStatus | ''
  severity: Severity | ''
  priority: Priority | ''
  search: string
}

const PAGE_SIZE = 20

export function useEscalatedTickets() {
  const { user } = useAuth()
  const role = user?.role ?? 'support_agent'
  const canSeeAll = role === 'team_lead' || role === 'admin'

  const [tickets, setTickets] = useState<TicketBrief[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<EscalatedTicketFilters>({
    status: '', severity: '', priority: '', search: '',
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    setTickets([])
    try {
      const params = {
        page, page_size: PAGE_SIZE, is_escalated: true,
        ...(filters.status   && { status:   filters.status   }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.priority && { priority: filters.priority }),
      }
      const res = canSeeAll
        ? await ticketService.getAllTickets(params)
        : await ticketService.getMyTickets(params)
      setTickets(res.items)
      setTotal(res.total)
    } catch (err) {
      console.error('useEscalatedTickets load error', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, filters.status, filters.severity, filters.priority, canSeeAll])

  useEffect(() => { load() }, [load])

  const displayed = filters.search
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(filters.search.toLowerCase()))
    : tickets

  return {
    tickets: displayed,
    total, page, setPage, isLoading,
    filters, setFilters,
    refetch: load,
    canSeeAll,
  }
}
