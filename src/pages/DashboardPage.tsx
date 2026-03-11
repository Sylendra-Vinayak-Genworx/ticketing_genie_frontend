import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, Users, ArrowRight } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge, PriorityBadge, SeverityBadge } from '@/components/ui/Badge'
import { SLATimer } from '@/components/ui/SLATimer'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatRelative } from '@/utils'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  bgColor: string
  change?: string
}

function StatCard({ label, value, icon: Icon, color, bgColor, change }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {change && <p className="text-xs text-gray-400 mt-1">{change}</p>}
      </div>
      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { list, total, isLoading, fetchMy, fetchAll } = useTickets()
  const role = user?.role || 'user'

  useEffect(() => {
    const params = { page: 1, page_size: 10 }
    if (role === 'user' || role === 'support_agent') {
      fetchMy(params)
    } else {
      fetchAll(params)
    }
  }, [role])

  const openCount = list.filter(t =>t.status === 'OPEN').length
  const progressCount = list.filter(t =>t.status === 'IN_PROGRESS').length
  const breachedCount = list.filter(t => t.is_breached).length
  const resolvedCount = list.filter(t => t.status === 'RESOLVED').length
  const escalatedCount = list.filter(t => t.is_escalated).length

  const recentTickets = list.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${user?.email ? ', ' + user.email.split('@')[0] : ''} 👋`}
        subtitle="Here's what's happening with your tickets today"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={total || list.length}
          icon={Ticket}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          label="Open"
          value={openCount}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          label="In Progress"
          value={progressCount}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          label="SLA Breached"
          value={breachedCount}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Role-based extra stats */}
      {(role === 'team_lead' || role === 'admin') && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Escalated"
            value={escalatedCount}
            icon={TrendingUp}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            label="On Hold"
            value={list.filter(t => t.status === 'ON_HOLD').length}
            icon={Users}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
        </div>
      )}

      {/* Recent Tickets */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
          <button
            onClick={() => navigate('/tickets')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            No tickets yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ticket</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SLA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">
                      {ticket.ticket_number}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ticket.product} · {ticket.environment}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={ticket.priority} />
                        <SeverityBadge severity={ticket.severity} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SLATimer dueAt={ticket.resolution_due_at} status={ticket.status} compact />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatRelative(ticket.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
