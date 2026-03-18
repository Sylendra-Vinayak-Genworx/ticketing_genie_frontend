import { ticketingApi } from '@/lib/axios'
import type { EmailConfig } from '../types'

export const emailConfigService = {
  async getConfig(): Promise<EmailConfig> {
    const res = await ticketingApi.get<EmailConfig>('/admin/email-config')
    return res.data
  },

  async updateConfig(payload: Record<string, any>): Promise<EmailConfig> {
    const res = await ticketingApi.patch<EmailConfig>('/admin/email-config', payload)
    return res.data
  },

  async sendTestEmail(testEmail: string): Promise<void> {
    await ticketingApi.post('/admin/email-config/test', { test_email: testEmail })
  },

  async initialize(): Promise<EmailConfig> {
    const res = await ticketingApi.post<EmailConfig>('/admin/email-config/initialize')
    return res.data
  },
}
