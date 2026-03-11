import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { analyticsService } from '@/features/analytics/services/analyticsService'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatMinutes, formatPercent } from '@/utils'
import type { DashboardData } from '@/types'

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#14b8a6']

function MetricCard({ label, value, sub, color = 'text-gray-900' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    analyticsService.getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner fullPage text="Loading analytics…" />
  if (error || !data) return (
    <div className="text-center py-16 text-gray-500">{error || 'No data available'}</div>
  )

  const { summary, distribution, sla_compliance, top_agents } = data

  const statusData = distribution.by_status.map(d => ({ name: d.label.replace('_', ' '), value: d.count }))
  const severityData = distribution.by_severity.map(d => ({ name: d.label, value: d.count }))
  const priorityData = distribution.by_priority.map(d => ({ name: d.label, value: d.count }))
  const productData = distribution.by_product.map(d => ({ name: d.label, value: d.count }))

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics Dashboard" subtitle="Overview of your support operations" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Tickets" value={summary.total_tickets} color="text-blue-600" />
        <MetricCard label="Open" value={summary.open_tickets} color="text-yellow-600" />
        <MetricCard label="Resolved" value={summary.resolved_tickets} color="text-green-600" />
        <MetricCard label="SLA Breached" value={summary.breached_tickets} color="text-red-600" />
        <MetricCard label="In Progress" value={summary.in_progress_tickets} color="text-indigo-600" />
        <MetricCard label="On Hold" value={summary.on_hold_tickets} color="text-gray-600" />
        <MetricCard label="Escalated" value={summary.escalated_tickets} color="text-orange-600" />
        <MetricCard label="Closed" value={summary.closed_tickets} />
      </div>

      {/* SLA Compliance */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">SLA Compliance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Response SLA Compliance</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${sla_compliance.response_compliance_pct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-green-600">{formatPercent(sla_compliance.response_compliance_pct)}</span>
            </div>
          </div>
          <div>      {/* Top Agents */}
      {top_agents.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Top Agents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Agent</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assigned</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Resolved</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Breached</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {top_agents.map(agent => (
                  <tr key={agent.agent_user_id} className="table-row">
                    <td className="px-4 py-3 font-medium text-gray-900">{agent.display_name}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{agent.total_assigned}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{agent.total_resolved}</td>
                    <td className="px-4 py-3 text-right text-red-500">{agent.total_breached}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatMinutes(Math.round(agent.avg_resolution_minutes))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
            <p className="text-xs text-gray-500 mb-1">Resolution SLA Compliance</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${sla_compliance.resolution_compliance_pct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-blue-600">{formatPercent(sla_compliance.resolution_compliance_pct)}</span>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Response Met</p>
              <p className="font-bold text-green-600">{sla_compliance.response_sla_met}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Breached</p>
              <p className="font-bold text-red-600">{sla_compliance.response_sla_breached}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Status */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Severity Pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Severity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Priority */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityData.map((_, i) => <Cell key={i} fill={['#ef4444','#f97316','#3b82f6','#94a3b8'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Product */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Product</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={productData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
