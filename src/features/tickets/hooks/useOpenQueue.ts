import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { ticketService } from '../services/ticketService'
import type { TicketBrief, Severity, Priority } from '@/types'

export interface OpenQueueFilters {
  severity: Severity | ''
  priority: Priority | ''
  search: string
}

const PAGE_SIZE = 20

export function useOpenQueue() {
  const { user } = useAuth()

  const [tickets, setTickets] = useState<TicketBrief[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [claimingId, setClaimingId] = useState<number | null>(null)
  const [filters, setFilters] = useState<OpenQueueFilters>({ severity: '', priority: '', search: '' })

  const load = useCallback(async () => {
    setIsLoading(true)
    setTickets([])
    try {
      const res = await ticketService.getAllTickets({
        page,
        page_size: PAGE_SIZE,
        queue_type: 'OPEN',
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.priority && { priority: filters.priority }),
      })
      setTickets(res.items)
      setTotal(res.total)
    } catch (err) {
      console.error('useOpenQueue load error', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, filters.severity, filters.priority])

  useEffect(() => { load() }, [load])

  const claimTicket = async (ticketId: number): Promise<void> => {
    if (!user) return
    setClaimingId(ticketId)
    try {
      await ticketService.assignTicket(ticketId, { assignee_id: user.id })
      await load()
    } catch (err) {
      console.error('Claim failed', err)
    } finally {
      setClaimingId(null)
    }
  }

  const displayed = filters.search
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(filters.search.toLowerCase()))
    : tickets

  return {
    tickets: displayed,
    total, page, setPage, isLoading, claimingId,
    filters, setFilters,
    claimTicket, refetch: load,
  }
}
