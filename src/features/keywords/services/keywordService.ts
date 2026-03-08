import { ticketingApi } from '@/lib/axios'
import type { KeywordRule, CreateKeywordRuleRequest, UpdateKeywordRuleRequest, PaginatedResponse } from '@/types'

export const keywordService = {
  async listRules(params?: { page?: number; page_size?: number; is_active?: boolean }): Promise<PaginatedResponse<KeywordRule>> {
    const res = await ticketingApi.get<PaginatedResponse<KeywordRule>>('/keyword-rules', { params })
    return res.data
  },

  async getRule(id: number): Promise<KeywordRule> {
    const res = await ticketingApi.get<KeywordRule>(`/keyword-rules/${id}`)
    return res.data
  },

  async createRule(data: CreateKeywordRuleRequest): Promise<KeywordRule> {
    const res = await ticketingApi.post<KeywordRule>('/keyword-rules', data)
    return res.data
  },

  async updateRule(id: number, data: UpdateKeywordRuleRequest): Promise<KeywordRule> {
    const res = await ticketingApi.put<KeywordRule>(`/keyword-rules/${id}`, data)
    return res.data
  },

  async deleteRule(id: number): Promise<void> {
    await ticketingApi.delete(`/keyword-rules/${id}`)
  },
}
