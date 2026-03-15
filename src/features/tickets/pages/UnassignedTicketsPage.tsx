import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, RefreshCw, Search, AlertTriangle, Clock, UserPlus, Zap } from 'lucide-react'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { Pagination } from '@/components/common/Pagination'
import { SkeletonRow, EmptyState } from '@/components/common/LoadingSpinner'
import { formatRelative } from '@/utils'
import type { Severity, Priority } from '@/types'
import { SEVERITIES, PRIORITIES } from '@/config/constants'

interface Filters { severity: Severity | ''; priority: Priority | ''; search: string }

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className={`card p-4 flex items-center gap-3 border-l-4 ${accent}`}>
      <div className="text-current opacity-60">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function UnassignedTicketsPage() {
  const navigate = useNavigate()
  const { list, total, page, pageSize, isLoading, fetchAll, setPage: setStorePage } = useTickets()

  const [filters, setFilters] = useState<Filters>({ severity: '', priority: '', search: '' })
  const [localPage, setLocalPage] = useState(1)

  function buildParams() {
    return {
      page: localPage, page_size: 20, is_unassigned: true,
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.priority && { priority: filters.priority }),
    }
  }

  const load = useCallback(() => { fetchAll(buildParams()) }, [localPage, filters.severity, filters.priority])
  useEffect(() => { load() }, [load])

  function handlePageChange(p: number) { setLocalPage(p); setStorePage(p) }

  const filteredList = filters.search
    ? list.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(filters.search.toLowerCase()))
    : list

  const criticalCount = filteredList.filter(t => t.severity === 'CRITICAL').length
  const breachedCount = filteredList.filter(t => t.is_breached).length
  const p0p1Count     = filteredList.filter(t => t.priority === 'P0' || t.priority === 'P1').length

  return (
    <div className="space-y-5">
      <PageHeader title="Unassigned Tickets" subtitle={`${total} ticket${total !== 1 ? 's' : ''} awaiting manual assignment`}
        actions={<button onClick={load} className="btn-ghost p-2" title="Refresh"><RefreshCw className="w-4 h-4" /></button>} />

      {total > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          <span>These tickets have <strong>no assigned agent</strong> — either escalation cleared the assignee or auto-assignment failed. Please assign each ticket to an available agent.</span>
        </div>
      )}

      {!isLoading && filteredList.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-500"    />} label="Critical severity" value={criticalCount} accent="border-red-400"    />
          <StatCard icon={<Clock         className="w-5 h-5 text-orange-500" />} label="SLA breached"      value={breachedCount}  accent="border-orange-400" />
          <StatCard icon={<Zap           className="w-5 h-5 text-amber-500"  />} label="P0 / P1 urgent"    value={p0p1Count}      accent="border-amber-400"  />
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by title or ticket #…" value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="input-field pl-9" />
          </div>
          <select value={filters.severity} onChange={e => { setFilters(f => ({ ...f, severity: e.target.value as Severity | '' })); setLocalPage(1) }} className="input-field w-auto min-w-[130px]">
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value as Priority | '' })); setLocalPage(1) }} className="input-field w-auto min-w-[120px]">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                {['Ticket #','Title','Priority','Severity','Status','Team','SLA','Waiting','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                : filteredList.map(ticket => (
                  <tr key={ticket.ticket_id} className="table-row cursor-pointer hover:bg-amber-50/40 transition-colors" onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                      <span className="text-amber-600">{ticket.ticket_number}</span>
                      {ticket.is_escalated && <span className="ml-1.5 text-orange-500" title="Escalated">▲</span>}
                      {ticket.is_breached  && <span className="ml-1 text-red-500"      title="SLA Breached">●</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-3"><SeverityBadge severity={ticket.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge   status={ticket.status}     /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {(ticket as any).team_id
                        ? <span className="font-medium text-violet-700">{(ticket as any).team_id.slice(0, 8)}…</span>
                        : <span className="text-gray-300 italic">No team</span>}
                    </td>
                    <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelative(ticket.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); navigate(`/tickets/${ticket.ticket_id}`) }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors whitespace-nowrap">
                        <UserPlus className="w-3 h-3" /> Assign
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {!isLoading && filteredList.length === 0 && (
          <EmptyState icon={<ClipboardList className="w-12 h-12 text-amber-200" />} title="No unassigned tickets"
            description={filters.search || filters.severity || filters.priority
              ? 'No tickets match your current filters' : 'All tickets have been successfully assigned'} />
        )}
        {!isLoading && filteredList.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination total={total} page={page} pageSize={pageSize} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </div>
  )
}
