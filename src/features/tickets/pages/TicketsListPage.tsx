import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Ticket, RefreshCw, AlertTriangle, UserPlus, UserCog, UserCheck } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useUserResolver } from '@/features/tickets/hooks/useUserResolver'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState, SkeletonRow } from '@/components/common/LoadingSpinner'
import { AssignModal } from '@/components/common/AssignModal'
import { formatRelative } from '@/utils'
import type { TicketBrief, TicketStatus, Severity, Priority } from '@/types'
import { TICKET_STATUSES, SEVERITIES, PRIORITIES } from '@/config/constants'

type QuickFilter = 'all' | 'unassigned' | 'escalated'

interface Filters {
  status: TicketStatus | ''
  severity: Severity | ''
  priority: Priority | ''
  search: string
  quickFilter: QuickFilter
}

export default function TicketsListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { list, total, page, pageSize, isLoading, fetchMy, fetchAll, setPage: setStorePage } = useTickets()
  const { cache: nameCache, resolve: resolveNames } = useUserResolver()
  const role = user?.role || 'user'

  const [filters, setFilters] = useState<Filters>({ status: '', severity: '', priority: '', search: '', quickFilter: 'all' })
  const [localPage, setLocalPage] = useState(1)
  const [tickets, setTickets] = useState<TicketBrief[]>([])
  const [assignTarget, setAssignTarget] = useState<TicketBrief | null>(null)

  const canSeeAll = role === 'team_lead' || role === 'admin'

  function buildParams() {
    return {
      page: localPage,
      page_size: 20,
      ...(filters.status                       && { status:        filters.status }),
      ...(filters.severity                     && { severity:      filters.severity }),
      ...(filters.priority                     && { priority:      filters.priority }),
      ...(filters.quickFilter === 'unassigned' && { is_unassigned: true }),
      ...(filters.quickFilter === 'escalated'  && { is_escalated:  true }),
    }
  }

  function load() {
    const params = buildParams()
    if (canSeeAll) fetchAll(params)
    else fetchMy(params)
  }

  useEffect(() => { load() }, [localPage, filters.status, filters.severity, filters.priority, filters.quickFilter, role])

  // Sync Redux list → local state, then resolve assignee names via hook
  useEffect(() => {
    setTickets(list)
    const ids = list.map(t => t.assignee_id).filter((id): id is string => !!id)
    if (ids.length > 0) resolveNames(ids)
  }, [list])

  function handlePageChange(p: number) { setLocalPage(p); setStorePage(p) }

  function toggleQuickFilter(qf: QuickFilter) {
    setFilters(f => ({ ...f, quickFilter: f.quickFilter === qf ? 'all' : qf }))
    setLocalPage(1)
  }

  const filteredList = filters.search
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(filters.search.toLowerCase()))
    : tickets

  function handleAssigned(updated: TicketBrief) {
    setTickets(ts => ts.map(t => t.ticket_id === updated.ticket_id ? { ...t, ...updated } : t))
    if (updated.assignee_id) resolveNames([updated.assignee_id])
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={role === 'admin' ? 'All Tickets' : role === 'team_lead' ? 'Team Tickets' : 'My Tickets'}
        subtitle={role === 'team_lead' ? `${total} tickets assigned to your team` : `${total} total tickets`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-ghost p-2" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            {role === 'user' && (
              <button onClick={() => navigate('/tickets/create')} className="btn-primary">
                <PlusCircle className="w-4 h-4" /> New Ticket
              </button>
            )}
          </div>
        }
      />

      <div className="card p-4 space-y-3">
        {canSeeAll && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Quick filter:</span>
            <button onClick={() => toggleQuickFilter('unassigned')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filters.quickFilter === 'unassigned'
                  ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
              }`}>
              <UserPlus className="w-3.5 h-3.5" /> Unassigned
            </button>
            <button onClick={() => toggleQuickFilter('escalated')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filters.quickFilter === 'escalated'
                  ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}>
              <AlertTriangle className="w-3.5 h-3.5" /> Escalated
            </button>
            {filters.quickFilter !== 'all' && (
              <button onClick={() => { setFilters(f => ({ ...f, quickFilter: 'all' })); setLocalPage(1) }}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">Clear filter</button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by title or ticket #…" value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="input-field pl-9" />
          </div>
          <select value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value as TicketStatus | '' })); setLocalPage(1) }}
            className="input-field w-auto min-w-[140px]">
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filters.severity}
            onChange={e => { setFilters(f => ({ ...f, severity: e.target.value as Severity | '' })); setLocalPage(1) }}
            className="input-field w-auto min-w-[130px]">
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority}
            onChange={e => { setFilters(f => ({ ...f, priority: e.target.value as Priority | '' })); setLocalPage(1) }}
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
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ticket #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SLA</th>
                {canSeeAll && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignee</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                {canSeeAll && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={canSeeAll ? 9 : 7} />)
                : filteredList.map(ticket => (
                  <tr key={ticket.ticket_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                      <button className="text-blue-600 hover:underline" onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                        {ticket.ticket_number}
                      </button>
                      {ticket.is_escalated && <span className="ml-1.5 text-orange-500" title="Escalated">▲</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[260px] cursor-pointer" onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                      <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge   status={ticket.status}     /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-3"><SeverityBadge severity={ticket.severity} /></td>
                    <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact /></td>
                    {canSeeAll && (
                      <td className="px-4 py-3 text-xs">
                        {ticket.assignee_id
                          ? <span className="font-medium text-gray-700">{nameCache[ticket.assignee_id] ?? `${ticket.assignee_id.slice(0, 8)}…`}</span>
                          : <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><UserCheck className="w-3 h-3" />Unassigned</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelative(ticket.updated_at)}</td>
                    {canSeeAll && (
                      <td className="px-4 py-3">
                        {ticket.assignee_id ? (
                          <button onClick={e => { e.stopPropagation(); setAssignTarget(ticket) }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap">
                            <UserCog className="w-3.5 h-3.5" /> Reassign
                          </button>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); setAssignTarget(ticket) }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors whitespace-nowrap">
                            <UserPlus className="w-3.5 h-3.5" /> Assign
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredList.length === 0 && (
          <EmptyState icon={<Ticket className="w-12 h-12" />} title="No tickets found"
            description="Try adjusting your filters or create a new ticket"
            action={role === 'user' ? (
              <button onClick={() => navigate('/tickets/create')} className="btn-primary">
                <PlusCircle className="w-4 h-4" /> Create Ticket
              </button>
            ) : undefined}
          />
        )}

        {!isLoading && filteredList.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination total={total} page={page} pageSize={pageSize} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      <AssignModal
        ticket={assignTarget}
        currentAssigneeName={assignTarget?.assignee_id ? nameCache[assignTarget.assignee_id] : null}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
    </div>
  )
}
