import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp,
  ArrowRight, RefreshCw, ShieldAlert, BarChart2, Activity,
  Zap, Search, Filter, X, Users, UserCheck, UserPlus,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useAuth } from '@/features/auth'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics'
import { useUserResolver } from '@/features/tickets/hooks/useUserResolver'
import { ticketService } from '@/features/tickets/services/ticketService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import { formatRelative, formatMinutes, formatPercent, formatDate } from '@/utils'
import type { DashboardData, TicketBrief, TicketStatus, Severity, Priority } from '@/types'
import { TICKET_STATUSES, SEVERITIES, PRIORITIES } from '@/config/constants'

const C = {
  blue:   '#3b82f6', violet: '#8b5cf6', amber:  '#f59e0b',
  green:  '#10b981', red:    '#ef4444', indigo: '#6366f1',
  orange: '#f97316', teal:   '#14b8a6', pink:   '#ec4899',
}
const PIE_COLORS = Object.values(C)

function KpiCard({ label, value, sub, icon: Icon, color, bg, onClick }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string; bg: string; onClick?: () => void
}) {
  return (
    <div onClick={onClick} className={`card p-5 flex items-start justify-between ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
    </div>
  )
}

function SectionCard({ title, action, children, noPad }: {
  title: string; action?: React.ReactNode; children: React.ReactNode; noPad?: boolean
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      <div className={noPad ? '' : 'p-4'}>{children}</div>
    </div>
  )
}

interface SearchFilters {
  search: string; status: TicketStatus | ''; priority: Priority | ''
  severity: Severity | ''; product: string; date_from: string; date_to: string
}
const EMPTY_FILTERS: SearchFilters = {
  search: '', status: '', priority: '', severity: '', product: '', date_from: '', date_to: '',
}

export default function DashboardPage() {
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const { list, total, isLoading, fetchMy, fetchAll } = useTickets()
  const role          = user?.role || 'user'
  const isPowerUser   = role === 'team_lead' || role === 'admin'
  const isAdmin       = role === 'admin'

  // ── Power-user tab state ─────────────────────────────────────────────────
  const [tab, setTab] = useState<'overview' | 'search' | 'reports'>('overview')

  // ── Analytics via hook (replaces analyticsService.getDashboard + useEffect) ─
  const { data: analyticsData, isLoading: anaLoading, isError: anaError, refetch: refetchAnalytics } = useAnalytics({ enabled: isPowerUser })

  // ── Analytics filter state (for date/product queries) ────────────────────
  const [anaDateFrom, setAnaDateFrom] = useState('')
  const [anaDateTo,   setAnaDateTo]   = useState('')
  const [anaProduct,  setAnaProduct]  = useState('')
  const [showAnaFilter, setShowAnaFilter] = useState(false)

  // Local analytics state — we keep a copy so we can apply user date/product filters via re-fetch if needed
  const [analytics, setAnalytics] = useState<DashboardData | null>(null)
  const [products, setProducts]   = useState<string[]>([])

  // Sync hook data to local state
  useEffect(() => {
    if (analyticsData) {
      setAnalytics(analyticsData)
      const ps = analyticsData.distribution.by_product.map(p => p.label)
      if (ps.length) setProducts(ps)
    }
  }, [analyticsData])

  // ── Search tab state ─────────────────────────────────────────────────────
  const [filters,   setFilters]   = useState<SearchFilters>(EMPTY_FILTERS)
  const [srTickets, setSrTickets] = useState<TicketBrief[]>([])
  const [srTotal,   setSrTotal]   = useState(0)
  const [srPage,    setSrPage]    = useState(1)
  const [srLoading, setSrLoading] = useState(false)
  // User resolver for search tab assignee names
  const { cache: nameCache, resolve: resolveNames } = useUserResolver()

  // ── Recent ticket search ─────────────────────────────────────────────────
  const [recentSearch, setRecentSearch] = useState('')

  const SR_PAGE_SIZE = 15

  // ── Load search/filter tickets ───────────────────────────────────────────
  const loadSearchTickets = useCallback(async () => {
    setSrLoading(true)
    setSrTickets([])
    try {
      const params: Record<string, any> = {
        page: srPage, page_size: SR_PAGE_SIZE,
        ...(filters.status   && { status:   filters.status   }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.product  && { product:  filters.product  }),
      }
      const res  = await ticketService.getAllTickets(params)
      let items  = res.items
      if (filters.search) {
        const q = filters.search.toLowerCase()
        items = items.filter(t =>
          t.ticket_number.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q))
      }
      setSrTickets(items)
      setSrTotal(res.total)
      // resolve names via hook
      const ids = [...new Set(items.map(t => t.assignee_id).filter((id): id is string => !!id))]
      if (ids.length) resolveNames(ids)
    } catch (e) {
      console.error(e)
    } finally {
      setSrLoading(false)
    }
  }, [srPage, filters])

  useEffect(() => {
    const params = { page: 1, page_size: 10 }
    if (isPowerUser) { fetchAll(params) }
    else fetchMy(params)
  }, [role])

  useEffect(() => { if (tab === 'search') loadSearchTickets() }, [tab, loadSearchTickets])

  // ── Derived values ───────────────────────────────────────────────────────
  const summary   = analytics?.summary
  const dist      = analytics?.distribution
  const sla       = analytics?.sla_compliance
  const topAgents = analytics?.top_agents ?? []

  const openCount      = list.filter(t => t.status === 'OPEN').length
  const progressCount  = list.filter(t => t.status === 'IN_PROGRESS').length
  const breachedCount  = list.filter(t => t.is_breached).length
  const resolvedCount  = list.filter(t => t.status === 'RESOLVED').length
  const escalatedCount = list.filter(t => t.is_escalated).length

  const recentTickets = (recentSearch
    ? list.filter(t =>
        t.title.toLowerCase().includes(recentSearch.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(recentSearch.toLowerCase()))
    : list
  ).slice(0, isPowerUser ? 6 : 10)

  const priorityData = dist?.by_priority.map(d => ({
    name: d.label, tickets: d.count,
    fill: d.label === 'P0' ? C.red : d.label === 'P1' ? C.orange : d.label === 'P2' ? C.amber : C.blue,
  })) ?? []
  const statusData   = dist?.by_status.map(d => ({ name: d.label.replace(/_/g, ' '), value: d.count })) ?? []
  const severityData = dist?.by_severity.map(d => ({ name: d.label, value: d.count })) ?? []
  const productData  = dist?.by_product.map(d => ({ name: d.label, tickets: d.count })) ?? []
  const slaBarData   = sla ? [
    { name: 'Response',   met: sla.response_sla_met,   breached: sla.response_sla_breached   },
    { name: 'Resolution', met: sla.resolution_sla_met, breached: sla.resolution_sla_breached },
  ] : []

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${user?.email ? ', ' + user.email.split('@')[0] : ''} 👋`}
        subtitle={isPowerUser ? 'Live analytics, search & reporting — all in one place' : "Here's what's happening with your tickets today"}
        actions={isPowerUser ? (
          <button onClick={() => { fetchAll({ page: 1, page_size: 10 }); refetchAnalytics() }} className="btn-ghost p-2" title="Refresh all">
            <RefreshCw className="w-4 h-4" />
          </button>
        ) : undefined}
      />

      {isPowerUser ? (
        <>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {([
              { id: 'overview', label: 'Overview',        icon: BarChart2  },
              { id: 'search',   label: 'Search & Filter', icon: Search     },
              { id: 'reports',  label: 'Reports',         icon: TrendingUp },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="card p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setShowAnaFilter(!showAnaFilter)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      showAnaFilter ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-200'
                    }`}>
                    <Filter className="w-3.5 h-3.5" /> Date & Product Filter
                  </button>
                  {(anaDateFrom || anaDateTo || anaProduct) && (
                    <button onClick={() => { setAnaDateFrom(''); setAnaDateTo(''); setAnaProduct('') }} className="text-xs text-gray-400 hover:text-red-500 underline">Clear</button>
                  )}
                </div>
                {showAnaFilter && (
                  <div className="mt-3 flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">From</label><input type="date" value={anaDateFrom} onChange={e => setAnaDateFrom(e.target.value)} className="input-field text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">To</label><input type="date" value={anaDateTo} onChange={e => setAnaDateTo(e.target.value)} className="input-field text-sm" /></div>
                    {products.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                        <select value={anaProduct} onChange={e => setAnaProduct(e.target.value)} className="input-field text-sm w-auto min-w-[130px]">
                          <option value="">All Products</option>
                          {products.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex items-end"><button onClick={() => refetchAnalytics()} className="btn-primary text-sm py-1.5">Apply</button></div>
                  </div>
                )}
              </div>

              {anaLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-50" />)}
                </div>
              ) : anaError ? (
                <div className="card p-6 text-center text-red-500 text-sm">Failed to load analytics data</div>
              ) : summary ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Total Tickets"  value={summary.total_tickets}       icon={Ticket}        color="text-blue-600"   bg="bg-blue-50"   onClick={() => navigate('/tickets')} />
                  <KpiCard label="Open"            value={summary.open_tickets}        icon={Clock}         color="text-yellow-600" bg="bg-yellow-50" onClick={() => navigate('/tickets')} />
                  <KpiCard label="In Progress"     value={summary.in_progress_tickets} icon={Activity}      color="text-indigo-600" bg="bg-indigo-50" />
                  <KpiCard label="Resolved"        value={summary.resolved_tickets}    icon={CheckCircle}   color="text-green-600"  bg="bg-green-50"  />
                  <KpiCard label="SLA Breached"    value={summary.breached_tickets}    icon={ShieldAlert}   color="text-red-600"    bg="bg-red-50"
                    sub={sla ? `${formatPercent(100 - sla.resolution_compliance_pct)} breach rate` : undefined} />
                  <KpiCard label="Escalated"       value={summary.escalated_tickets}   icon={AlertTriangle} color="text-orange-600" bg="bg-orange-50" onClick={() => navigate('/tickets/escalated')} />
                  <KpiCard label="On Hold"         value={summary.on_hold_tickets}     icon={Clock}         color="text-purple-600" bg="bg-purple-50" />
                  <KpiCard label="Closed"          value={summary.closed_tickets}      icon={CheckCircle}   color="text-gray-600"   bg="bg-gray-100"  />
                </div>
              ) : null}

              {analytics && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <SectionCard title="Open Tickets by Priority" action={<span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Real-time</span>}>
                      {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={priorityData} barSize={44}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip formatter={(v: number) => [v, 'Tickets']} />
                            <Bar dataKey="tickets" radius={[4, 4, 0, 0]}>{priorityData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <p className="text-sm text-gray-400 text-center py-12">No data</p>}
                    </SectionCard>

                    <SectionCard title="SLA Compliance">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-green-600">{formatPercent(sla?.response_compliance_pct ?? 0)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Response SLA met</p>
                          <p className="text-xs text-red-400 mt-0.5">{sla?.response_sla_breached ?? 0} breached</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-blue-600">{formatPercent(sla?.resolution_compliance_pct ?? 0)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Resolution SLA met</p>
                          <p className="text-xs text-red-400 mt-0.5">{sla?.resolution_sla_breached ?? 0} breached</p>
                        </div>
                      </div>
                      {slaBarData.length > 0 && (
                        <ResponsiveContainer width="100%" height={130}>
                          <BarChart data={slaBarData} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="met"      fill={C.green} name="Met"      radius={[4, 4, 0, 0]} />
                            <Bar dataKey="breached" fill={C.red}   name="Breached" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </SectionCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <SectionCard title="By Status">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number, n: string) => [v, n]} />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </SectionCard>
                    <SectionCard title="By Severity">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={severityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {severityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number, n: string) => [v, n]} />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </SectionCard>
                    <SectionCard title="By Product">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={productData} layout="vertical" barSize={14}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
                          <Tooltip formatter={(v: number) => [v, 'Tickets']} />
                          <Bar dataKey="tickets" fill={C.violet} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </SectionCard>
                  </div>

                  {topAgents.length > 0 && (
                    <SectionCard title="Agent Performance" noPad>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              {['Agent','Assigned','Resolved','Breached','Avg Resolution','Resolve Rate'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {topAgents.map(a => {
                              const rate = a.total_assigned > 0 ? a.total_resolved / a.total_assigned * 100 : 0
                              return (
                                <tr key={a.agent_user_id} className="hover:bg-gray-50/60 transition-colors">
                                  <td className="px-4 py-3 font-medium text-gray-900">{a.display_name}</td>
                                  <td className="px-4 py-3 text-gray-600">{a.total_assigned}</td>
                                  <td className="px-4 py-3 text-green-600 font-medium">{a.total_resolved}</td>
                                  <td className="px-4 py-3"><span className={a.total_breached > 0 ? 'text-red-600 font-medium' : 'text-gray-300'}>{a.total_breached}</span></td>
                                  <td className="px-4 py-3 text-gray-600">{a.avg_resolution_minutes ? formatMinutes(Math.round(a.avg_resolution_minutes)) : '—'}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, rate)}%` }} />
                                      </div>
                                      <span className="text-xs text-gray-500">{formatPercent(rate)}</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  )}
                </>
              )}

              {isAdmin && (
                <SectionCard title="Admin Quick Links">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'User Management', desc: 'Manage agents and tiers',       path: '/users',      icon: Users,      color: 'blue'   },
                      { label: 'Team Management', desc: 'Configure teams & assignments',  path: '/teams',      icon: UserPlus,   color: 'indigo' },
                      { label: 'SLA Config',      desc: 'SLA rules and thresholds',       path: '/sla-config', icon: ShieldAlert, color: 'violet' },
                    ].map(({ label, desc, path, icon: Icon }) => (
                      <button key={path} onClick={() => navigate(path)} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors text-left">
                        <div className="p-3 rounded-lg bg-violet-100 text-violet-600"><Icon className="w-5 h-5" /></div>
                        <div><h3 className="font-medium text-gray-900">{label}</h3><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
                      </button>
                    ))}
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Recent Tickets" noPad
                action={<button onClick={() => navigate('/tickets')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></button>}
              >
                <div className="px-5 py-3 border-b border-gray-50">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" placeholder="Search recent tickets…" value={recentSearch} onChange={e => setRecentSearch(e.target.value)} className="input-field pl-8 py-1.5 text-sm h-8" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="py-12 flex justify-center"><LoadingSpinner /></div>
                ) : recentTickets.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    {recentSearch ? 'No matching tickets' : 'No tickets yet'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Ticket','Title','Status','Priority','SLA','Updated'].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentTickets.map(ticket => (
                          <tr key={ticket.ticket_id} className="cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                            <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold whitespace-nowrap">
                              {ticket.ticket_number}
                              {ticket.is_escalated && <span className="ml-1 text-orange-500">▲</span>}
                              {ticket.is_breached  && <span className="ml-1 text-red-500">●</span>}
                            </td>
                            <td className="px-4 py-3 max-w-[240px]">
                              <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                            </td>
                            <td className="px-4 py-3"><StatusBadge   status={ticket.status}     /></td>
                            <td className="px-4 py-3"><div className="flex items-center gap-1.5"><PriorityBadge priority={ticket.priority} /><SeverityBadge severity={ticket.severity} /></div></td>
                            <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact /></td>
                            <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(ticket.updated_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* ── TAB: SEARCH & FILTER ─────────────────────────────────────── */}
          {tab === 'search' && (
            <div className="space-y-4">
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Filter className="w-4 h-4" /> Search & Filters</h3>
                  {hasFilters && (
                    <button onClick={() => { setFilters(EMPTY_FILTERS); setSrPage(1) }} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search by ticket ID, subject, or keywords…" value={filters.search}
                    onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setSrPage(1) }} className="input-field pl-9" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value as TicketStatus | '' })); setSrPage(1) }} className="input-field w-auto min-w-[140px]">
                    <option value="">All Statuses</option>
                    {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <select value={filters.priority} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value as Priority | '' })); setSrPage(1) }} className="input-field w-auto min-w-[120px]">
                    <option value="">All Priorities</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={filters.severity} onChange={e => { setFilters(f => ({ ...f, severity: e.target.value as Severity | '' })); setSrPage(1) }} className="input-field w-auto min-w-[130px]">
                    <option value="">All Severities</option>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {products.length > 0 && (
                    <select value={filters.product} onChange={e => { setFilters(f => ({ ...f, product: e.target.value })); setSrPage(1) }} className="input-field w-auto min-w-[130px]">
                      <option value="">All Products</option>
                      {products.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                  <input type="date" value={filters.date_from} title="From date" onChange={e => { setFilters(f => ({ ...f, date_from: e.target.value })); setSrPage(1) }} className="input-field text-sm" />
                  <input type="date" value={filters.date_to} title="To date" onChange={e => { setFilters(f => ({ ...f, date_to: e.target.value })); setSrPage(1) }} className="input-field text-sm" />
                </div>
                {hasFilters && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(filters).filter(([, v]) => !!v).map(([key, val]) => (
                      <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full border border-violet-200">
                        {key.replace(/_/g, ' ')}: {String(val)}
                        <button onClick={() => { setFilters(f => ({ ...f, [key]: '' })); setSrPage(1) }}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <SectionCard title={srLoading ? 'Loading…' : `${srTotal} ticket${srTotal !== 1 ? 's' : ''} found`} noPad>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Ticket #','Title','Status','Priority','Severity','Assignee','SLA','Created'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {srLoading
                        ? Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-20" /></td>)}</tr>)
                        : srTickets.length === 0
                          ? <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No tickets match your filters</td></tr>
                          : srTickets.map(ticket => (
                            <tr key={ticket.ticket_id} className="cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                              <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 whitespace-nowrap">
                                {ticket.ticket_number}
                                {ticket.is_escalated && <span className="ml-1 text-orange-500">▲</span>}
                                {ticket.is_breached  && <span className="ml-1 text-red-500">●</span>}
                              </td>
                              <td className="px-4 py-3 max-w-[220px]">
                                <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                              </td>
                              <td className="px-4 py-3"><StatusBadge   status={ticket.status}     /></td>
                              <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                              <td className="px-4 py-3"><SeverityBadge severity={ticket.severity} /></td>
                              <td className="px-4 py-3 text-xs">
                                {ticket.assignee_id
                                  ? <span className="font-medium text-gray-700">{nameCache[ticket.assignee_id] ?? `${ticket.assignee_id.slice(0, 8)}…`}</span>
                                  : <span className="text-amber-600 flex items-center gap-1"><UserCheck className="w-3 h-3" />Unassigned</span>}
                              </td>
                              <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact /></td>
                              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(ticket.created_at)}</td>
                            </tr>
                          ))
                      }
                    </tbody>
                  </table>
                </div>
                {!srLoading && srTickets.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <Pagination total={srTotal} page={srPage} pageSize={SR_PAGE_SIZE} onPageChange={setSrPage} />
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* ── TAB: REPORTS ─────────────────────────────────────────────── */}
          {tab === 'reports' && (
            <div className="space-y-5">
              {anaLoading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}
              {anaError   && <div className="card p-8 text-center text-red-500">Failed to load analytics data</div>}
              {analytics && !anaLoading && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard label="Total"           value={summary!.total_tickets}    icon={Ticket}      color="text-blue-600"   bg="bg-blue-50"   />
                    <KpiCard label="SLA Breached"    value={summary!.breached_tickets} icon={ShieldAlert} color="text-red-600"    bg="bg-red-50"    />
                    <KpiCard label="Response SLA %"  value={sla ? formatPercent(sla.response_compliance_pct)   : '—'} icon={CheckCircle} color="text-green-600"  bg="bg-green-50"  />
                    <KpiCard label="Resolution SLA %" value={sla ? formatPercent(sla.resolution_compliance_pct) : '—'} icon={CheckCircle} color="text-violet-600" bg="bg-violet-50" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <SectionCard title="SLA Compliance Report">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                          <span className="text-gray-500">Total tickets analysed</span>
                          <span className="font-bold text-gray-900">{sla?.total_tickets ?? 0}</span>
                        </div>
                        {[
                          { label: 'Response SLA met',      value: sla?.response_sla_met       ?? 0, pct: sla?.response_compliance_pct    ?? 0, color: 'bg-green-400' },
                          { label: 'Response SLA breached', value: sla?.response_sla_breached   ?? 0, pct: sla ? (sla.response_sla_breached / (sla.total_tickets || 1) * 100) : 0, color: 'bg-red-400' },
                          { label: 'Resolution SLA met',    value: sla?.resolution_sla_met      ?? 0, pct: sla?.resolution_compliance_pct  ?? 0, color: 'bg-blue-400' },
                          { label: 'Resolution breached',   value: sla?.resolution_sla_breached ?? 0, pct: sla ? (sla.resolution_sla_breached / (sla.total_tickets || 1) * 100) : 0, color: 'bg-amber-400' },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{row.label}</span><span className="font-semibold text-gray-900">{row.value}</span></div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: `${Math.min(100, row.pct)}%` }} /></div>
                            <p className="text-xs text-gray-400 mt-0.5 text-right">{formatPercent(row.pct)}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard title="Open Tickets by Priority">
                      <div className="space-y-2 mb-4">
                        {priorityData.map(p => (
                          <div key={p.name} className="flex items-center gap-3">
                            <span className="text-xs font-bold w-8 text-gray-600">{p.name}</span>
                            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: priorityData.length && Math.max(...priorityData.map(x => x.tickets)) > 0 ? `${p.tickets / Math.max(...priorityData.map(x => x.tickets)) * 100}%` : '0%', backgroundColor: p.fill }} />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-6 text-right">{p.tickets}</span>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={priorityData} barSize={36}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip formatter={(v: number) => [v, 'Tickets']} />
                          <Bar dataKey="tickets" radius={[4, 4, 0, 0]}>{priorityData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </SectionCard>
                  </div>

                  {topAgents.length > 0 && (
                    <SectionCard title="Agent First Response & Resolution Times" noPad>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              {['Agent','Assigned','Resolved','Breached','Avg Resolution','Resolve %'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {[...topAgents].sort((a, b) => b.total_assigned - a.total_assigned).map(a => {
                              const rate = a.total_assigned > 0 ? a.total_resolved / a.total_assigned * 100 : 0
                              return (
                                <tr key={a.agent_user_id} className="hover:bg-gray-50/60 transition-colors">
                                  <td className="px-4 py-3 font-medium text-gray-900">{a.display_name}</td>
                                  <td className="px-4 py-3 text-gray-600">{a.total_assigned}</td>
                                  <td className="px-4 py-3 text-green-600 font-medium">{a.total_resolved}</td>
                                  <td className="px-4 py-3"><span className={a.total_breached > 0 ? 'text-red-600 font-medium' : 'text-gray-300'}>{a.total_breached}</span></td>
                                  <td className="px-4 py-3">{a.avg_resolution_minutes ? <span className="font-medium text-violet-700">{formatMinutes(Math.round(a.avg_resolution_minutes))}</span> : <span className="text-gray-300">—</span>}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 min-w-[100px]">
                                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, rate)}%` }} /></div>
                                      <span className="text-xs text-gray-500">{formatPercent(rate)}</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  )}
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Tickets" value={total || list.length} icon={Ticket}        color="text-blue-600"   bg="bg-blue-50"   />
            <KpiCard label="Open"          value={openCount}            icon={Clock}          color="text-yellow-600" bg="bg-yellow-50" />
            <KpiCard label="In Progress"   value={progressCount}        icon={Activity}       color="text-indigo-600" bg="bg-indigo-50" />
            <KpiCard label="Resolved"      value={resolvedCount}        icon={CheckCircle}    color="text-green-600"  bg="bg-green-50"  />
            <KpiCard label="SLA Breached"  value={breachedCount}        icon={ShieldAlert}    color="text-red-600"    bg="bg-red-50"    />
            <KpiCard label="Escalated"     value={escalatedCount}       icon={AlertTriangle}  color="text-orange-600" bg="bg-orange-50" />
            <KpiCard label="On Hold"       value={list.filter(t => t.status === 'ON_HOLD').length} icon={Clock} color="text-purple-600" bg="bg-purple-50" />
            <KpiCard label="New"           value={list.filter(t => t.status === 'NEW').length}     icon={Zap}   color="text-teal-600"   bg="bg-teal-50"   />
          </div>

          <SectionCard title="Recent Tickets" noPad
            action={<button onClick={() => navigate('/tickets')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></button>}
          >
            {isLoading ? (
              <div className="py-12 flex justify-center"><LoadingSpinner /></div>
            ) : recentTickets.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm"><Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />No tickets yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Ticket','Title','Status','Priority','SLA','Updated'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentTickets.map(ticket => (
                      <tr key={ticket.ticket_id} className="cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}>
                        <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{ticket.ticket_number}</td>
                        <td className="px-4 py-3 max-w-[280px]">
                          <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1.5"><PriorityBadge priority={ticket.priority} /><SeverityBadge severity={ticket.severity} /></div></td>
                        <td className="px-4 py-3"><SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(ticket.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )
}
