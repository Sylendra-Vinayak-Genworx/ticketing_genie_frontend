import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Ticket,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  UserCog,
  UserCheck,
  UsersRound,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  ShieldAlert,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { useUserResolver } from '@/features/tickets/hooks/useUserResolver';
import { useTeamPerformance } from '@/features/tickets/hooks/useTeamPerformance';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge';
import { SLATimer } from '@/features/sla/components/SLATimer';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState, SkeletonRow } from '@/components/common/LoadingSpinner';
import { AssignModal } from '@/features/tickets/components/AssignModal';
import { formatRelative } from '@/utils';
import type { TicketBrief, TicketStatus, Severity, Priority } from '@/types';
import { TICKET_STATUSES, SEVERITIES, PRIORITIES } from '@/config/constants';
import type { TeamStat } from '@/features/tickets/hooks/useTeamPerformance';

type QuickFilter = 'all' | 'unassigned' | 'escalated';

interface Filters {
  status: TicketStatus | '';
  severity: Severity | '';
  priority: Priority | '';
  search: string;
  quickFilter: QuickFilter;
  teamId: string;
}

/** Normalise any ID to a lowercase string — mirrors the hook's helper. */
function normalise(id: unknown): string {
  return String(id ?? '')
    .toLowerCase()
    .trim();
}

// ── Mini progress bar ─────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-5 text-right">{value}</span>
    </div>
  );
}

// ── Rate pill ─────────────────────────────────────────────────────────────────
function RatePill({ pct, good }: { pct: number; good: boolean }) {
  const color = good
    ? pct >= 70
      ? 'bg-green-100 text-green-700'
      : pct >= 40
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700'
    : pct >= 30
      ? 'bg-red-100 text-red-700'
      : pct >= 10
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-green-100 text-green-700';
  const Icon = good
    ? pct >= 70
      ? TrendingUp
      : pct >= 40
        ? Minus
        : TrendingDown
    : pct >= 30
      ? TrendingDown
      : Minus;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}
    >
      <Icon className="w-3 h-3" />
      {pct}%
    </span>
  );
}

// ── Per-team card ─────────────────────────────────────────────────────────────
function TeamPerformanceCard({
  stat,
  isSelected,
  onClick,
}: {
  stat: TeamStat;
  isSelected: boolean;
  onClick: () => void;
}) {
  // The lead is NOT in team.members (API returns only agents).
  // Show the lead's name from members if they happen to appear, otherwise
  // show a truncated UUID until we have a name cache here.
  const leadMember = stat.team.members?.find(
    (m) => normalise(m.id) === normalise(stat.team.lead_id)
  );
  const leadName =
    leadMember?.full_name ||
    leadMember?.email ||
    (stat.team.lead_id ? stat.team.lead_id.slice(0, 8) + '…' : 'None');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`card p-4 text-left transition-all hover:shadow-md w-full ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{stat.team.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Lead: {leadName} · {stat.team.members?.length ?? 0} members
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-2xl font-bold text-gray-900 leading-none">{stat.total}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">tickets</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 w-16 uppercase tracking-wide shrink-0">
            Open
          </span>
          <MiniBar value={stat.open} max={stat.total} color="bg-blue-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 w-16 uppercase tracking-wide shrink-0">
            In Prog.
          </span>
          <MiniBar value={stat.inProgress} max={stat.total} color="bg-indigo-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 w-16 uppercase tracking-wide shrink-0">
            Resolved
          </span>
          <MiniBar value={stat.resolved} max={stat.total} color="bg-green-400" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 font-medium">
          <Flame className="w-3 h-3" />
          {stat.escalated} escalated
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium">
          <ShieldAlert className="w-3 h-3" />
          {stat.breached} breached
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-gray-400">Res.</span>
          <RatePill pct={stat.resolutionRate} good />
        </span>
      </div>

      {isSelected && (
        <p className="mt-2 pt-2 border-t border-blue-200 text-[11px] text-blue-600 font-medium text-center">
          ✓ Filtering by this team
        </p>
      )}
    </button>
  );
}

// ── Summary strip ─────────────────────────────────────────────────────────────
function PerformanceSummary({ stats }: { stats: TeamStat[] }) {
  if (stats.length === 0) return null;
  const totalTickets = stats.reduce((s, t) => s + t.total, 0);
  const totalResolved = stats.reduce((s, t) => s + t.resolved, 0);
  const totalBreached = stats.reduce((s, t) => s + t.breached, 0);
  const totalEscalated = stats.reduce((s, t) => s + t.escalated, 0);
  const overallRes = totalTickets > 0 ? Math.round((totalResolved / totalTickets) * 100) : 0;
  const best = [...stats].sort((a, b) => b.resolutionRate - a.resolutionRate)[0];
  const worst = [...stats].sort((a, b) => a.resolutionRate - b.resolutionRate)[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {[
        {
          icon: <Ticket className="w-4 h-4 text-blue-500" />,
          label: 'Total Tickets',
          value: totalTickets,
          border: 'border-blue-300',
        },
        {
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          label: 'Overall Resolution',
          value: `${overallRes}%`,
          border: 'border-green-300',
        },
        {
          icon: <ShieldAlert className="w-4 h-4 text-red-500" />,
          label: 'SLA Breached',
          value: totalBreached,
          border: 'border-red-300',
        },
        {
          icon: <Flame className="w-4 h-4 text-orange-500" />,
          label: 'Escalated',
          value: totalEscalated,
          border: 'border-orange-300',
        },
      ].map(({ icon, label, value, border }) => (
        <div key={label} className={`card p-3 flex items-center gap-3 border-l-4 ${border}`}>
          <div className="opacity-70">{icon}</div>
          <div>
            <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{label}</p>
          </div>
        </div>
      ))}

      {stats.length > 1 && (
        <>
          <div className="card p-3 flex items-center gap-2 border-l-4 border-green-400 col-span-2">
            <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                Best: <span className="text-green-700">{best.team.name}</span>
              </p>
              <p className="text-[10px] text-gray-400">
                {best.resolutionRate}% resolution · {best.total} tickets
              </p>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-2 border-l-4 border-amber-400 col-span-2">
            <TrendingDown className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                Needs Attention: <span className="text-amber-700">{worst.team.name}</span>
              </p>
              <p className="text-[10px] text-gray-400">
                {worst.resolutionRate}% resolution · {worst.breachRate}% breach rate
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TicketsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    list,
    total,
    page,
    pageSize,
    isLoading,
    fetchMy,
    fetchAll,
    setPage: setStorePage,
  } = useTickets();
  const { cache: nameCache, resolve: resolveNames } = useUserResolver();
  const role = user?.role || 'user';

  const isAdmin = role === 'admin';
  const canSeeAll = role === 'team_lead' || isAdmin;

  const [filters, setFilters] = useState<Filters>({
    status: '',
    severity: '',
    priority: '',
    search: '',
    quickFilter: 'all',
    teamId: '',
  });
  const [localPage, setLocalPage] = useState(1);
  const [tickets, setTickets] = useState<TicketBrief[]>([]);
  const [assignTarget, setAssignTarget] = useState<TicketBrief | null>(null);
  const [showPerf, setShowPerf] = useState(false);

  const {
    teams,
    stats: teamStats,
    isLoading: perfLoading,
    reload: reloadPerf,
  } = useTeamPerformance();

  // ── assignee-id → team-id  (normalised keys, mirrors the hook) ───────────
  // The lead is NOT in team.members — we explicitly add them via team.lead_id.
  // All IDs are normalised to lowercase so UUID casing never causes a miss.
  const assigneeToTeamId = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => {
      if (team.lead_id) map.set(normalise(team.lead_id), team.id);
      team.members?.forEach((m) => map.set(normalise(m.id), team.id));
    });
    return map;
  }, [teams]);

  // ── team-id → Set<member-id>  (normalised, for client-side filtering) ────
  const teamMemberSet = useMemo(() => {
    const map = new Map<string, Set<string>>();
    teams.forEach((team) => {
      const ids = new Set<string>();
      if (team.lead_id) ids.add(normalise(team.lead_id));
      team.members?.forEach((m) => ids.add(normalise(m.id)));
      map.set(team.id, ids);
    });
    return map;
  }, [teams]);

  /** Resolve the canonical team-id for a ticket using assignee first, then team_id. */
  function resolveTicketTeamId(ticket: TicketBrief): string | undefined {
    if (ticket.assignee_id) {
      const t = assigneeToTeamId.get(normalise(ticket.assignee_id));
      if (t) return t;
    }
    if (ticket.team_id) {
      const normTid = normalise(ticket.team_id);
      const matched = teams.find((t) => normalise(t.id) === normTid);
      if (matched) return matched.id;
    }
    return undefined;
  }

  function buildParams() {
    const params: Record<string, any> = {
      page: localPage,
      page_size: 20,
      ...(filters.status && { status: filters.status }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.quickFilter === 'unassigned' && { is_unassigned: true }),
      ...(filters.quickFilter === 'escalated' && { is_escalated: true }),
    };
    // For team filtering we rely on client-side filtering (see filteredList)
    // because ticket.team_id is unreliable. No team_id param sent to backend.
    return params;
  }

  function load() {
    const params = buildParams();
    if (canSeeAll) fetchAll(params);
    else fetchMy(params);
  }

  useEffect(
    () => {
      load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localPage, filters.status, filters.severity, filters.priority, filters.quickFilter, role]
  );

  useEffect(() => {
    setTickets(list);
    const ids = list.map((t) => t.assignee_id).filter((id): id is string => !!id);
    if (ids.length > 0) resolveNames(ids);
  }, [list]);

  // When team filter changes, reset to page 1 and reload
  useEffect(() => {
    setLocalPage(1);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.teamId]);

  function handlePageChange(p: number) {
    setLocalPage(p);
    setStorePage(p);
  }

  function toggleQuickFilter(qf: QuickFilter) {
    setFilters((f) => ({ ...f, quickFilter: f.quickFilter === qf ? 'all' : qf }));
    setLocalPage(1);
  }

  function selectTeamFilter(teamId: string) {
    setFilters((f) => ({ ...f, teamId: f.teamId === teamId ? '' : teamId }));
  }

  // Client-side filtering: search + team membership via assignee lookup
  const filteredList = useMemo(() => {
    let result = tickets;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.ticket_number.toLowerCase().includes(q)
      );
    }

    if (filters.teamId) {
      const memberIds = teamMemberSet.get(filters.teamId);
      if (memberIds && memberIds.size > 0) {
        result = result.filter((t) => {
          const resolvedTeam = resolveTicketTeamId(t);
          return resolvedTeam === filters.teamId;
        });
      }
    }

    return result;
  }, [tickets, filters.search, filters.teamId, assigneeToTeamId, teamMemberSet]);

  function handleAssigned(updated: TicketBrief) {
    setTickets((ts) =>
      ts.map((t) => (t.ticket_id === updated.ticket_id ? { ...t, ...updated } : t))
    );
    if (updated.assignee_id) resolveNames([updated.assignee_id]);
  }

  const activeTeamName = filters.teamId ? teams.find((t) => t.id === filters.teamId)?.name : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={isAdmin ? 'All Tickets' : role === 'team_lead' ? 'Team Tickets' : 'My Tickets'}
        subtitle={
          role === 'team_lead' ? `${total} tickets assigned to your team` : `${total} total tickets`
        }
        actions={
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-ghost p-2" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowPerf((p) => !p)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                  showPerf
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Team Performance
                {showPerf ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            {role === 'user' && (
              <button onClick={() => navigate('/tickets/create')} className="btn-primary">
                <PlusCircle className="w-4 h-4" /> New Ticket
              </button>
            )}
          </div>
        }
      />

      {/* ── Team Performance Panel ──────────────────────────────────────────── */}
      {isAdmin && showPerf && (
        <div className="card p-5 space-y-4 border-blue-200 bg-gradient-to-br from-blue-50/40 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Team Performance Analysis</h2>
              <span className="hidden sm:inline text-xs text-gray-400">
                — click a card to filter the ticket list by that team
              </span>
            </div>
            <button
              onClick={reloadPerf}
              className="btn-ghost py-1 px-2 text-xs"
              title="Refresh performance data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${perfLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {perfLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card h-44 skeleton rounded-xl" />
              ))}
            </div>
          ) : teamStats.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">
              No teams found. Create teams from the Teams page.
            </p>
          ) : (
            <>
              <PerformanceSummary stats={teamStats} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {teamStats.map((stat) => (
                  <TeamPerformanceCard
                    key={stat.team.id}
                    stat={stat}
                    isSelected={filters.teamId === stat.team.id}
                    onClick={() => selectTeamFilter(stat.team.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="card p-4 space-y-3">
        {canSeeAll && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">
              Quick filter:
            </span>
            <button
              onClick={() => toggleQuickFilter('unassigned')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filters.quickFilter === 'unassigned'
                  ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Unassigned
            </button>
            <button
              onClick={() => toggleQuickFilter('escalated')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filters.quickFilter === 'escalated'
                  ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Escalated
            </button>
            {filters.quickFilter !== 'all' && (
              <button
                onClick={() => {
                  setFilters((f) => ({ ...f, quickFilter: 'all' }));
                  setLocalPage(1);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
              >
                Clear filter
              </button>
            )}
            {activeTeamName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-700 border-blue-300 shadow-sm">
                <UsersRound className="w-3.5 h-3.5" />
                {activeTeamName}
                <button
                  onClick={() => setFilters((f) => ({ ...f, teamId: '' }))}
                  className="ml-1 hover:text-blue-900 font-bold leading-none"
                  title="Clear team filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
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
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value as TicketStatus | '' }));
              setLocalPage(1);
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
          <select
            value={filters.severity}
            onChange={(e) => {
              setFilters((f) => ({ ...f, severity: e.target.value as Severity | '' }));
              setLocalPage(1);
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
          <select
            value={filters.priority}
            onChange={(e) => {
              setFilters((f) => ({ ...f, priority: e.target.value as Priority | '' }));
              setLocalPage(1);
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
          {isAdmin && teams.length > 0 && (
            <select
              value={filters.teamId}
              onChange={(e) => setFilters((f) => ({ ...f, teamId: e.target.value }))}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Ticket Table ────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ticket #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Title
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
                {canSeeAll && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Assignee
                  </th>
                )}
                {isAdmin && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Team
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Updated
                </th>
                {role === 'team_lead' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} cols={isAdmin ? 10 : canSeeAll ? 9 : 7} />
                  ))
                : filteredList.map((ticket) => {
                    const resolvedTeamId = resolveTicketTeamId(ticket);
                    const teamName = resolvedTeamId
                      ? teams.find((t) => t.id === resolvedTeamId)?.name
                      : null;

                    return (
                      <tr
                        key={ticket.ticket_id}
                        className={`hover:bg-gray-50/60 transition-colors ${
                          ticket.is_escalated ? 'bg-orange-50/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                          >
                            {ticket.ticket_number}
                          </button>
                          {ticket.is_escalated && (
                            <span className="ml-1.5 text-orange-500" title="Escalated">
                              ▲
                            </span>
                          )}
                          {ticket.is_breached && (
                            <span className="ml-1 text-red-500" title="SLA Breached">
                              ●
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 max-w-[220px] cursor-pointer"
                          onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                        >
                          <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {ticket.product} · {ticket.environment}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <SeverityBadge severity={ticket.severity} />
                        </td>
                        <td className="px-4 py-3">
                          <SLATimer
                            responseDueAt={ticket.response_due_at}
                            resolutionDueAt={ticket.resolution_due_at}
                            status={ticket.status}
                            isBreached={ticket.is_breached}
                            resolvedAt={ticket.resolved_at}
                            resolutionSlaCompletedAt={ticket.resolution_sla_completed_at}
                            updatedAt={ticket.updated_at}
                            compact
                          />
                        </td>
                        {canSeeAll && (
                          <td className="px-4 py-3 text-xs">
                            {ticket.assignee_id ? (
                              <span className="font-medium text-gray-700">
                                {nameCache[ticket.assignee_id] ??
                                  `${ticket.assignee_id.slice(0, 8)}…`}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                                <UserCheck className="w-3 h-3" />
                                Unassigned
                              </span>
                            )}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 text-xs">
                            {teamName && resolvedTeamId ? (
                              <button
                                onClick={() => selectTeamFilter(resolvedTeamId)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border transition-colors ${
                                  filters.teamId === resolvedTeamId
                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                                }`}
                                title={`Filter by ${teamName}`}
                              >
                                <UsersRound className="w-2.5 h-2.5" />
                                {teamName}
                              </button>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatRelative(ticket.updated_at)}
                        </td>
                        {role === 'team_lead' && (
                          <td className="px-4 py-3">
                            {ticket.assignee_id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignTarget(ticket);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap"
                              >
                                <UserCog className="w-3.5 h-3.5" /> Reassign
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignTarget(ticket);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors whitespace-nowrap"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> Assign
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredList.length === 0 && (
          <EmptyState
            icon={<Ticket className="w-12 h-12" />}
            title="No tickets found"
            description={
              filters.teamId
                ? `No tickets found for team "${activeTeamName}"`
                : 'Try adjusting your filters or create a new ticket'
            }
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

      <AssignModal
        ticket={assignTarget}
        currentAssigneeName={assignTarget?.assignee_id ? nameCache[assignTarget.assignee_id] : null}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
    </div>
  );
}
