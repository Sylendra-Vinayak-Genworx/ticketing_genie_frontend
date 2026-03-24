import { useMemo } from 'react'
import type { Ticket, DashboardData } from '@/types'

const C = {
  blue:   '#3b82f6', violet: '#8b5cf6', amber:  '#f59e0b',
  green:  '#10b981', red:    '#ef4444', indigo: '#6366f1',
  orange: '#f97316', teal:   '#14b8a6', pink:   '#ec4899',
}

interface UseDashboardMetricsProps {
  list: any[]
  analytics: DashboardData | null
  recentSearch: string
  isPowerUser: boolean
}

export function useDashboardMetrics({ list, analytics, recentSearch, isPowerUser }: UseDashboardMetricsProps) {
  return useMemo(() => {
    // Basic Counts
    const openCount         = list.filter(t => t.status === 'OPEN').length
    const progressCount     = list.filter(t => t.status === 'IN_PROGRESS').length
    const breachedCount     = list.filter(t => t.is_breached).length
    const resolvedCount     = list.filter(t => t.status === 'RESOLVED').length
    const escalatedCount    = list.filter(t => t.is_escalated).length
    const onHoldCount       = list.filter(t => t.status === 'ON_HOLD').length
    const closedCount       = list.filter(t => t.status === 'CLOSED').length
    const acknowledgedCount = list.filter(t => t.status === 'ACKNOWLEDGED').length

    // Recent Tickets Filter
    const recentTickets = (recentSearch
      ? list.filter(t =>
          t.title.toLowerCase().includes(recentSearch.toLowerCase()) ||
          t.ticket_number.toLowerCase().includes(recentSearch.toLowerCase()))
      : list
    ).slice(0, isPowerUser ? 6 : 10)

    // Chart Data Generation
    const dist = analytics?.distribution
    const sla  = analytics?.sla_compliance

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

    return {
      counts: {
        openCount,
        progressCount,
        breachedCount,
        resolvedCount,
        escalatedCount,
        onHoldCount,
        closedCount,
        acknowledgedCount
      },
      recentTickets,
      chartData: {
        priorityData,
        statusData,
        severityData,
        productData,
        slaBarData
      }
    }
  }, [list, analytics, recentSearch, isPowerUser])
}
