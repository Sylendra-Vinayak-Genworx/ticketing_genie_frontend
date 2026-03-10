import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronUp,
  Flame,
  Clock,
  Users,
} from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { Pagination } from '@/components/common/Pagination'
import { SkeletonRow, EmptyState } from '@/components/common/LoadingSpinner'
import { formatRelative } from '@/utils'
import type { TicketStatus, Severity, Priority } from '@/types'
import { TICKET_STATUSES, SEVERITIES, PRIORITIES } from '@/config/constants'

// ── Escalation level pill ─────────────────────────────────────────────────────

function EscalationLevelBadge({ level }: { level: number }) {
  const configs: Record<number, { label: string; classes: string }> = {
    1: { label: 'L1', classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    2: { label: 'L2', classes: 'bg-orange-100 text-orange-700 border border-orange-200' },
    3: { label: 'L3', classes: 'bg-red-100 text-red-700 border border-red-200' },
  }
  const cfg = configs[level] ?? {
    label: `L${level}`,
    classes: 'bg-red-100 text-red-800 border border-red-300',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${cfg.classes}`}
    >
      <ChevronUp className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  accent: string
}) {
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

// ── Filters ───────────────────────────────────────────────────────────────────

interface Filters {
  status: TicketStatus | ''
  severity: Severity | ''
  priority: Priority | ''
  search: string
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EscalatedTicketsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { list, total, page, pageSize, isLoading, fetchAll, setPage: setStorePage } =
    useTickets()

  const [filters, setFilters] = useState<Filters>({
    status: '',
    severity: '',
    priority: '',
    search: '',
  })
  const [localPage, setLocalPage] = useState(1)

  function buildParams() {
    return {
      page: localPage,
      page_size: 20,
      is_escalated: true,
      ...(filters.status && { status: filters.status }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.priority && { priority: filters.priority }),
    }
  }

  const load = useCallback(() => {
    fetchAll(buildParams())
  }, [localPage, filters.status, filters.severity, filters.priority])

  useEffect(() => {
    load()
  }, [load])

  function handlePageChange(p: number) {
    setLocalPage(p)
    setStorePage(p)
  }

  const filteredList = filters.search
    ? list.filter(
        (t) =>
          t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          t.ticket_number.toLowerCase().includes(filters.search.toLowerCase()),
      )
    : list

  // Derived stats
  const criticalCount = filteredList.filter(
    (t) => t.severity === 'Critical' || t.severity === 'HIGH',
  ).length
  const breachedCount = filteredList.filter((t) => {
    if (!t.resolution_due_at) return false
    return new Date(t.resolution_due_at) < new Date()
  }).length
  const unassignedCount = filteredList.filter((t) => !t.assignee_id).length

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Escalated Tickets
          </span>
        }
        subtitle={`${total} escalated ticket${total !== 1 ? 's' : ''} requiring attention`}
        actions={
          <button onClick={load} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* ── Alert banner ── */}
      {total > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
          <span>
            These tickets have been escalated and require immediate review. Assign or take action
            before SLA deadlines are missed.
          </span>
        </div>
      )}

      {/* ── Stat cards ── */}
      {!isLoading && filteredList.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Flame className="w-5 h-5 text-red-500" />}
            label="Critical severity"
            value={criticalCount}
            accent="border-red-400"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-orange-500" />}
            label="SLA breached"
            value={breachedCount}
            accent="border-orange-400"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-yellow-500" />}
            label="Unassigned"
            value={unassignedCount}
            accent="border-yellow-400"
          />
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or ticket #…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="input-field pl-9"
            />
          </div>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value as TicketStatus | '' }))
              setLocalPage(1)
            }}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={filters.severity}
            onChange={(e) => {
              setFilters((f) => ({ ...f, severity: e.target.value as Severity | '' }))
              setLocalPage(1)
            }}
            className="input-field w-auto min-w-[130px]"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={filters.priority}
            onChange={(e) => {
              setFilters((f) => ({ ...f, priority: e.target.value as Priority | '' }))
              setLocalPage(1)
            }}
            className="input-field w-auto min-w-[120px]"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-50 border-b border-orange-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ticket #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Level
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Severity
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  SLA
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Assignee
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                : filteredList.map((ticket) => (
                    <tr
                      key={ticket.ticket_id}
                      className="table-row cursor-pointer hover:bg-orange-50/40 transition-colors"
                      onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                    >
                      {/* Ticket number */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                        <span className="text-orange-600">{ticket.ticket_number}</span>
                        <span className="ml-1.5 text-orange-400" title="Escalated">
                          ▲
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {ticket.product} · {ticket.environment}
                        </p>
                      </td>

                      {/* Escalation level */}
                      <td className="px-4 py-3">
                        <EscalationLevelBadge level={ticket.escalation_level ?? 1} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3">
                        <SeverityBadge severity={ticket.severity} />
                      </td>

                      {/* SLA */}
                      <td className="px-4 py-3">
                        <SLATimer
                          dueAt={ticket.resolution_due_at}
                          status={ticket.status}
                          compact
                        />
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {ticket.assignee_id ? (
                          <span className="font-medium text-gray-700">
                            {ticket.assignee_id.slice(0, 8)}…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-500 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatRelative(ticket.updated_at)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!isLoading && filteredList.length === 0 && (
          <EmptyState
            icon={<AlertTriangle className="w-12 h-12 text-orange-300" />}
            title="No escalated tickets"
            description={
              filters.search || filters.status || filters.severity || filters.priority
                ? 'No escalated tickets match your current filters'
                : 'All clear — no tickets have been escalated'
            }
          />
        )}

        {/* Pagination */}
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