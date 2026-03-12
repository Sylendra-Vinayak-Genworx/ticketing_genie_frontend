import { ticketingApi } from '@/lib/axios'

export interface CustomerTier {
  tier_id: number
  name: string
  description: string | null
}

export const tierService = {
  async listTiers(): Promise<CustomerTier[]> {
    const res = await ticketingApi.get<CustomerTier[]>('/tiers')
    return res.data
  },
}
