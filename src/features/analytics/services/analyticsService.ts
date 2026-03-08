import { ticketingApi } from '@/lib/axios'
import type { DashboardData, SLACompliance, AgentPerformance, CustomerReport } from '@/types'

interface AnalyticsParams {
  date_from?: string
  date_to?: string
  product?: string
  customer_tier_id?: number
}

export const analyticsService = {
  async getDashboard(params?: AnalyticsParams): Promise<DashboardData> {
    const res = await ticketingApi.get<DashboardData>('/analytics/dashboard', { params })
    return res.data
  },

  async getSLACompliance(params?: AnalyticsParams): Promise<SLACompliance> {
    const res = await ticketingApi.get<SLACompliance>('/analytics/sla-compliance', { params })
    return res.data
  },

  async getAgentPerformance(agentId: string): Promise<AgentPerformance> {
    const res = await ticketingApi.get<AgentPerformance>(`/analytics/agents/${agentId}`)
    return res.data
  },

  async getCustomerReports(params?: AnalyticsParams): Promise<CustomerReport[]> {
    const res = await ticketingApi.get<CustomerReport[]>('/analytics/customers', { params })
    return res.data
  },

  async getMyReport(): Promise<CustomerReport> {
    const res = await ticketingApi.get<CustomerReport>('/analytics/me')
    return res.data
  },
}
