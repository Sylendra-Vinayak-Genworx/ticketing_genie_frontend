import { ticketingApi } from '@/lib/axios'
import type { SLA, SLARule, CreateSLARequest, CreateSLARuleRequest, UpdateSLARuleRequest, PaginatedResponse } from '@/types'

export const slaService = {
  async listSLAs(params?: { page?: number; page_size?: number; is_active?: boolean }): Promise<PaginatedResponse<SLA>> {
    const res = await ticketingApi.get<PaginatedResponse<SLA>>('/sla-rules', { params })
    return res.data
  },

  async getSLA(id: number): Promise<SLA> {
    const res = await ticketingApi.get<SLA>(`/sla-rules/${id}`)
    return res.data
  },

  async createSLA(data: CreateSLARequest): Promise<SLA> {
    const res = await ticketingApi.post<SLA>('/sla-rules', data)
    return res.data
  },

  async updateSLA(id: number, data: Partial<CreateSLARequest>): Promise<SLA> {
    const res = await ticketingApi.put<SLA>(`/sla-rules/${id}`, data)
    return res.data
  },

  async deleteSLA(id: number): Promise<void> {
    await ticketingApi.delete(`/sla-rules/${id}`)
  },

  async listRules(slaId: number): Promise<SLARule[]> {
    const res = await ticketingApi.get<SLARule[]>(`/sla-rules/${slaId}/rules`)
    return res.data
  },

  async createRule(slaId: number, data: CreateSLARuleRequest): Promise<SLARule> {
    const res = await ticketingApi.post<SLARule>(`/sla-rules/${slaId}/rules`, data)
    return res.data
  },

  async updateRule(ruleId: number, data: UpdateSLARuleRequest): Promise<SLARule> {
    const res = await ticketingApi.put<SLARule>(`/sla-rules/rules/${ruleId}`, data)
    return res.data
  },

  async deleteRule(ruleId: number): Promise<void> {
    await ticketingApi.delete(`/sla-rules/rules/${ruleId}`)
  },
}
