import { ticketingApi } from '@/lib/axios'
import type { PriorityRule, CreatePriorityRuleRequest, UpdatePriorityRuleRequest } from '../types'

export const priorityRuleService = {
  async listRules(): Promise<PriorityRule[]> {
    const res = await ticketingApi.get<PriorityRule[]>('/priority-rules')
    return res.data
  },

  async getRule(id: number): Promise<PriorityRule> {
    const res = await ticketingApi.get<PriorityRule>(`/priority-rules/${id}`)
    return res.data
  },

  async createRule(data: CreatePriorityRuleRequest): Promise<PriorityRule> {
    const res = await ticketingApi.post<PriorityRule>('/priority-rules', data)
    return res.data
  },

  async updateRule(id: number, data: UpdatePriorityRuleRequest): Promise<PriorityRule> {
    const res = await ticketingApi.put<PriorityRule>(`/priority-rules/${id}`, data)
    return res.data
  },

  async deleteRule(id: number): Promise<void> {
    await ticketingApi.delete(`/priority-rules/${id}`)
  },
}
