import { authApi, ticketingApi } from '@/lib/axios'
import type {
  User, UserUpdateRequest, UserCreateRequest, UserCreateResponse,
  AgentSkillListResponse, AgentSkillUpdateRequest,
} from '@/types'

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const res = await authApi.get<User[]>('/auth/users')
    return res.data
  },

  async getUserById(userId: string): Promise<User> {
    const res = await authApi.get<User>(`/auth/users/${userId}`)
    return res.data
  },

  async createUser(data: UserCreateRequest): Promise<UserCreateResponse> {
    const res = await authApi.post<UserCreateResponse>('/auth/admin/users', data)
    return res.data
  },

  async updateUser(userId: string, data: UserUpdateRequest): Promise<User> {
    const res = await authApi.patch<User>(`/auth/users/${userId}`, data)
    return res.data
  },

  async getAgentsByLead(leadId: string): Promise<User[]> {
    const res = await authApi.get<User[]>(`/auth/leads/${leadId}/agents`)
    return res.data
  },

  async getUserSkills(userId: string): Promise<AgentSkillListResponse> {
    const res = await ticketingApi.get<AgentSkillListResponse>(`/admin/users/${userId}/skills`)
    return res.data
  },

  async updateUserSkills(userId: string, data: AgentSkillUpdateRequest): Promise<AgentSkillListResponse> {
    const res = await ticketingApi.put<AgentSkillListResponse>(`/admin/users/${userId}/skills`, data)
    return res.data
  },
}
