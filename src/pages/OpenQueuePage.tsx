import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListOrdered, RefreshCw, Search, Inbox, Zap, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { ticketService } from '@/features/tickets/services/ticketService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { Pagination } from '@/components/common/Pagination'
import { SkeletonRow, EmptyState } from '@/components/common/LoadingSpinner'
import { formatRelative } from '@/utils'
import type { TicketBrief, Severity, Priority } from '@/types'
import { SEVERITIES, PRIORITIES } from '@/config/constants'

interface Filters { severity: Severity | ''; priority: Priority | ''; search: string }

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className={`card p-4 flex items-center gap-3 border-l-4 ${accent}`}>
      <div className="opacity-60">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function OpenQueuePage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  // ── Fully isolated local state — never touches shared Redux tickets.list ──
  const [tickets,    setTickets]    = useState<TicketBrief[]>([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [isLoading,  setIsLoading]  = useState(false)
  const [claimingId, setClaimingId] = useState<number | null>(null)
  const [filters,    setFilters]    = useState<Filters>({ severity: '', priority: '', search: '' })
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setIsLoading(true)
    setTickets([])   // wipe immediately — no stale flash from previous page
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
      console.error('OpenQueuePage load error', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, filters.severity, filters.priority])

  useEffect(() => { load() }, [load])

  async function handleClaim(e: React.MouseEvent, ticketId: number) {
    e.stopPropagation()
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

  const criticalCount = displayed.filter(t => t.severity === 'CRITICAL').length
  const breachedCount  = displayed.filter(t => t.is_breached).length
  const p0p1Count      = displayed.filter(t => t.priority === 'P0' || t.priority === 'P1').length

  return (
    <div className="space-y-5">
      <PageHeader
        title={"Open Queue"}
        subtitle={`${total} unassigned ticket${total !== 1 ? 's' : ''} available to claim`}
        actions={<button onClick={load} className="btn-ghost p-2" title="Refresh"><RefreshCw className="w-4 h-4" /></button>}
      />

      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-sm">
        <Inbox className="w-4 h-4 mt-0.5 shrink-0 text-sky-500" />
        <span>Tickets in the <strong>open queue</strong> have no assigned agent. Claim one to take ownership and start working on it.</span>
      </div>

      {!isLoading && displayed.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-500"    />} label="Critical severity" value={criticalCount} accent="border-red-400"    />
          <StatCard icon={<Clock         className="w-5 h-5 text-orange-500" />} label="SLA breached"      value={breachedCount}  accent="border-orange-400" />
          <StatCard icon={<Zap           className="w-5 h-5 text-yellow-500" />} label="P0 / P1 priority"  value={p0p1Count}      accent="border-yellow-400" />
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by title or ticket #…" value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="input-field pl-9" />
          </div>
          <select value={filters.severity}
            onChange={e => { setFilters(f => ({ ...f, severity: e.target.value as Severity | '' })); setPage(1) }}
            className="input-field w-auto min-w-[130px]">
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority}
            onChange={e => { setFilters(f => ({ ...f, priority: e.target.value as Priority | '' })); setPage(1) }}
            className="input-field w-auto min-w-[120px]">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50 border-b border-sky-100">
                {['Ticket #','Title','Priority','Severity','Status','SLA','Created','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : displayed.map(ticket => (
                  <tr key={ticket.ticket_id}
                    className="table-row cursor-pointer hover:bg-sky-50/40 transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                    <td className="px-4 py-3 font-mono text-xs text-sky-600 font-semibold whitespace-nowrap">
                      {ticket.ticket_number}
                      {ticket.is_breached && <span className="ml-1.5 text-red-500" title="SLA Breached">●</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-3"><SeverityBadge severity={ticket.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} isBreached={ticket.is_breached} compact /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelative(ticket.created_at)}</td>
                    <td className="px-4 py-3">
                        <button onClick={e => handleClaim(e, ticket.ticket_id)} disabled={claimingId === ticket.ticket_id}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                          {claimingId === ticket.ticket_id ? 'Claiming…' : 'Claim'}
                        </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!isLoading && displayed.length === 0 && (
          <EmptyState icon={<Inbox className="w-12 h-12 text-sky-200" />} title="Open queue is empty"
            description={filters.search || filters.severity || filters.priority
              ? 'No tickets match your current filters'
              : 'All tickets have been assigned — great work!'} />
        )}
        {!isLoading && displayed.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={p => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  )
}