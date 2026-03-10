import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Filter, Ticket, RefreshCw } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { Pagination } from '@/components/common/Pagination'
import { LoadingSpinner, EmptyState, SkeletonRow } from '@/components/common/LoadingSpinner'
import { formatRelative } from '@/utils'
import type { TicketStatus, Severity, Priority } from '@/types'
import { TICKET_STATUSES, SEVERITIES, PRIORITIES } from '@/config/constants'

interface Filters {
  status: TicketStatus | ''
  severity: Severity | ''
  priority: Priority | ''
  search: string
}

export default function TicketsListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { list, total, page, pageSize, isLoading, fetchMy, fetchAll, setPage: setStorePage } = useTickets()
  const role = user?.role || 'user'

  const [filters, setFilters] = useState<Filters>({ status: '', severity: '', priority: '', search: '' })
  const [localPage, setLocalPage] = useState(1)

  const canSeeAll = role === 'team_lead' || role === 'admin'

  function buildParams() {
    return {
      page: localPage,
      page_size: 20,
      ...(filters.status && { status: filters.status }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.priority && { priority: filters.priority }),
    }
  }

  function load() {
    const params = buildParams()
    if (canSeeAll) fetchAll(params)
    else fetchMy(params)
  }

  useEffect(() => { load() }, [localPage, filters.status, filters.severity, filters.priority, role])

  function handlePageChange(p: number) {
    setLocalPage(p)
    setStorePage(p)
  }

  const filteredList = filters.search
    ? list.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(filters.search.toLowerCase())
      )
    : list

  return (
    <div className="space-y-5">
      <PageHeader
        title={role === 'admin' ? 'All Tickets' : role === 'team_lead' ? 'Team Tickets' : 'My Tickets'}
        subtitle={role === 'team_lead' ? `${total} tickets assigned to your team` : `${total} total tickets`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-ghost p-2" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            {(role === 'user') && (
              <button onClick={() => navigate('/tickets/create')} className="btn-primary">
                <PlusCircle className="w-4 h-4" /> New Ticket
              </button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or ticket #…"
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="input-field pl-9"
            />
          </div>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value as TicketStatus | '' })); setLocalPage(1) }}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>

          {/* Severity */}
          <select
            value={filters.severity}
            onChange={(e) => { setFilters(f => ({ ...f, severity: e.target.value as Severity | '' })); setLocalPage(1) }}
            className="input-field w-auto min-w-[130px]"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Priority */}
          <select
            value={filters.priority}
            onChange={(e) => { setFilters(f => ({ ...f, priority: e.target.value as Priority | '' })); setLocalPage(1) }}
            className="input-field w-auto min-w-[120px]"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={canSeeAll ? 8 : 7} />)
                : filteredList.map((ticket) => (
                    <tr
                      key={ticket.ticket_id}
                      className="table-row cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold whitespace-nowrap">
                        {ticket.ticket_number}
                        {ticket.is_escalated && (
                          <span className="ml-1.5 text-orange-500" title="Escalated">▲</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-4 py-3"><SeverityBadge severity={ticket.severity} /></td>
                      <td className="px-4 py-3">
                        <SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact />
                      </td>
                      {canSeeAll && (
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {ticket.assignee_id
                            ? <span className="font-medium text-gray-700">{ticket.assignee_id.slice(0, 8)}…</span>
                            : <span className="text-gray-300">Unassigned</span>
                          }
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatRelative(ticket.updated_at)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredList.length === 0 && (
          <EmptyState
            icon={<Ticket className="w-12 h-12" />}
            title="No tickets found"
            description="Try adjusting your filters or create a new ticket"
            action={
              role === 'user' ? (
                <button onClick={() => navigate('/tickets/create')} className="btn-primary">
                  <PlusCircle className="w-4 h-4" /> Create Ticket
                </button>
              ) : undefined
            }
          />
        )}

        {!isLoading && filteredList.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}