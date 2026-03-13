import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Search, ChevronUp, Flame, Clock, Users } from 'lucide-react'
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

function EscalationLevelBadge({ level }: { level: number }) {
  const cfg: Record<number, { label: string; classes: string }> = {
    1: { label: 'L1', classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    2: { label: 'L2', classes: 'bg-orange-100 text-orange-700 border border-orange-200' },
    3: { label: 'L3', classes: 'bg-red-100    text-red-700    border border-red-200'    },
  }
  const { label, classes } = cfg[level] ?? { label: `L${level}`, classes: 'bg-red-100 text-red-800 border border-red-300' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${classes}`}>
      <ChevronUp className="w-3 h-3" />{label}
    </span>
  )
}

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

interface Filters { status: TicketStatus | ''; severity: Severity | ''; priority: Priority | ''; search: string }

export default function EscalatedTicketsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role      = user?.role ?? 'support_agent'
  const canSeeAll = role === 'team_lead' || role === 'admin'

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
      const params = {
        page, page_size: PAGE_SIZE, is_escalated: true,
        ...(filters.status   && { status:   filters.status   }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.priority && { priority: filters.priority }),
      }
      // Agents see only their own escalated tickets; leads/admins see all
      const res = canSeeAll
        ? await ticketService.getAllTickets(params)
        : await ticketService.getMyTickets(params)
      setTickets(res.items)
      setTotal(res.total)
    } catch (err) {
      console.error('EscalatedTicketsPage load error', err)
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

  const criticalCount   = displayed.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH').length
  const breachedCount   = displayed.filter(t => t.is_breached).length
  const unassignedCount = displayed.filter(t => !t.assignee_id).length

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          
            "Escalated Tickets"
        
        }
        subtitle={`${total} escalated ticket${total !== 1 ? 's' : ''} requiring attention`}
        actions={<button onClick={load} className="btn-ghost p-2" title="Refresh"><RefreshCw className="w-4 h-4" /></button>}
      />

      {total > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
          <span>
            {canSeeAll
              ? 'These tickets have been escalated due to SLA breaches and require immediate review or re-assignment.'
              : 'Your tickets have been escalated. A lead has been notified — add an update or comment to show progress.'}
          </span>
        </div>
      )}

      {!isLoading && displayed.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<Flame className="w-5 h-5 text-red-500"    />} label="Critical / High" value={criticalCount}   accent="border-red-400"    />
          <StatCard icon={<Clock className="w-5 h-5 text-orange-500" />} label="SLA breached"    value={breachedCount}   accent="border-orange-400" />
          <StatCard icon={<Users className="w-5 h-5 text-yellow-500" />} label="Unassigned"      value={unassignedCount} accent="border-yellow-400" />
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
              <tr className="bg-orange-50 border-b border-orange-100">
                {['Ticket #','Title','Level','Status','Priority','Severity','SLA',
                  ...(canSeeAll ? ['Assignee'] : []), 'Updated', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={canSeeAll ? 9 : 8} />)
                : displayed.map(ticket => (
                  <tr key={ticket.ticket_id}
                    className="table-row cursor-pointer hover:bg-orange-50/40 transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                      <span className="text-orange-600">{ticket.ticket_number}</span>
                      <span className="ml-1.5 text-orange-400" title="Escalated">▲</span>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                    </td>
                    <td className="px-4 py-3"><EscalationLevelBadge level={ticket.escalation_level ?? 1} /></td>
                    <td className="px-4 py-3"><StatusBadge   status={ticket.status}     /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-3"><SeverityBadge severity={ticket.severity} /></td>
                    <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} isBreached={ticket.is_breached} compact /></td>
                    {canSeeAll && (
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {ticket.assignee_id
                          ? <span className="font-medium text-gray-700">{ticket.assignee_id.slice(0, 8)}…</span>
                          : <span className="inline-flex items-center gap-1 text-orange-500 font-medium"><AlertTriangle className="w-3 h-3" />Unassigned</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelative(ticket.updated_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/tickets/${ticket.ticket_id}`)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!isLoading && displayed.length === 0 && (
          <EmptyState icon={<AlertTriangle className="w-12 h-12 text-orange-300" />} title="No escalated tickets"
            description={filters.search || filters.status || filters.severity || filters.priority
              ? 'No escalated tickets match your current filters'
              : 'All clear — no tickets have been escalated'} />
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