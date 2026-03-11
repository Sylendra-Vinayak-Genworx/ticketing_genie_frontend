import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UsersRound, RefreshCw, Search, AlertTriangle, Clock, CheckCircle2, UserCheck } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { ticketService } from '@/features/tickets/services/ticketService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { Pagination } from '@/components/common/Pagination'
import { SkeletonRow, EmptyState } from '@/components/common/LoadingSpinner'
import { formatRelative } from '@/utils'
import type { TicketBrief, TicketStatus, Severity, Priority } from '@/types'
import { TICKET_STATUSES, SEVERITIES, PRIORITIES } from '@/config/constants'

interface Filters { status: TicketStatus | ''; severity: Severity | ''; priority: Priority | ''; search: string }

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

export default function TeamTicketsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const teamId   = (user as any)?.team_id as string | undefined

  // ── Fully isolated local state — never touches shared Redux tickets.list ──
  const [tickets,   setTickets]   = useState<TicketBrief[]>([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [filters,   setFilters]   = useState<Filters>({ status: '', severity: '', priority: '', search: '' })
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setIsLoading(true)
    setTickets([])   // wipe immediately — no stale flash from previous page
    try {
      const res = await ticketService.getAllTickets({
        page, page_size: PAGE_SIZE,
        ...(teamId           && { team_id:  teamId           }),
        ...(filters.status   && { status:   filters.status   }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.priority && { priority: filters.priority }),
      })
      setTickets(res.items)
      setTotal(res.total)
    } catch (err) {
      console.error('TeamTicketsPage load error', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, filters.status, filters.severity, filters.priority, teamId])

  useEffect(() => { load() }, [load])

  const displayed = filters.search
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(filters.search.toLowerCase()))
    : tickets

  const activeCount    = displayed.filter(t => ['OPEN','IN_PROGRESS','ON_HOLD'].includes(t.status)).length
  const breachedCount  = displayed.filter(t => t.is_breached).length
  const unclaimedCount = displayed.filter(t => !t.assignee_id).length
  const resolvedCount  = displayed.filter(t => ['RESOLVED','CLOSED'].includes(t.status)).length

  return (
    <div className="space-y-5">
      <PageHeader
        title={"Team Tickets"}
        subtitle={`${total} ticket${total !== 1 ? 's' : ''} owned by your team`}
        actions={<button onClick={load} className="btn-ghost p-2" title="Refresh"><RefreshCw className="w-4 h-4" /></button>}
      />

      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-violet-50 border border-violet-200 text-violet-800 text-sm">
        <UsersRound className="w-4 h-4 mt-0.5 shrink-0 text-violet-500" />
        <span>Tickets routed to <strong>your team's queue</strong>. Unclaimed tickets need an agent to self-claim. Escalated tickets require immediate attention.</span>
      </div>

      {!isLoading && displayed.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={<Clock        className="w-5 h-5 text-blue-500"   />} label="Active"      value={activeCount}    accent="border-blue-400"   />
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-orange-500"/>} label="SLA breached" value={breachedCount}  accent="border-orange-400" />
          <StatCard icon={<UserCheck    className="w-5 h-5 text-yellow-500" />} label="Unclaimed"   value={unclaimedCount} accent="border-yellow-400" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500"  />} label="Resolved"    value={resolvedCount}  accent="border-green-400"  />
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by title or ticket #…" value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="input-field pl-9" />
          </div>
          <select value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value as TicketStatus | '' })); setPage(1) }}
            className="input-field w-auto min-w-[140px]">
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
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
              <tr className="bg-violet-50 border-b border-violet-100">
                {['Ticket #','Title','Status','Priority','Severity','SLA','Assignee','Updated'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : displayed.map(ticket => (
                  <tr key={ticket.ticket_id}
                    className="table-row cursor-pointer hover:bg-violet-50/40 transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                      <span className="text-violet-600">{ticket.ticket_number}</span>
                      {ticket.is_escalated && <span className="ml-1.5 text-orange-500" title="Escalated">▲</span>}
                      {ticket.is_breached  && <span className="ml-1 text-red-500"      title="SLA Breached">●</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge   status={ticket.status}     /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-3"><SeverityBadge severity={ticket.severity} /></td>
                    <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact /></td>
                    <td className="px-4 py-3 text-xs">
                      {ticket.assignee_id
                        ? <span className="font-medium text-gray-700">{ticket.assignee_id.slice(0, 8)}…</span>
                        : <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><UserCheck className="w-3 h-3" />Unclaimed</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelative(ticket.updated_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!isLoading && displayed.length === 0 && (
          <EmptyState icon={<UsersRound className="w-12 h-12 text-violet-200" />} title="No team tickets"
            description={filters.search || filters.status || filters.severity || filters.priority
              ? 'No tickets match your current filters'
              : 'Your team has no active tickets'} />
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