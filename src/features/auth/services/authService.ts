import { authApi } from '@/lib/axios'
import type {
  LoginRequest, SignupRequest, AuthTokens, User,
  Team, TeamListResponse, TeamCreateRequest, AddMemberRequest, TeamMember,
} from '@/types'

export const authService = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(data: LoginRequest): Promise<AuthTokens> {
    const res = await authApi.post<AuthTokens>('/auth/login', data)
    return res.data
  },

  async signup(data: SignupRequest): Promise<{ user: User; message: string }> {
    const res = await authApi.post<{ user: User; message: string }>('/auth/signup', data)
    return res.data
  },

  async refresh(): Promise<AuthTokens> {
    const res = await authApi.post<AuthTokens>('/auth/refresh')
    return res.data
  },

  async logout(accessToken: string): Promise<void> {
    await authApi.post('/auth/logout', null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  },

  async getMe(): Promise<User> {
    const res = await authApi.get<User>('/auth/me')
    return res.data
  },

  async getUserById(userId: string): Promise<User> {
    const res = await authApi.get<User>(`/auth/users/${userId}`)
    return res.data
  },

  async getAllUsers(): Promise<User[]> {
    const res = await authApi.get<User[]>('/auth/users')
    return res.data
  },

  async getAgentsByLead(leadId: string): Promise<User[]> {
    const res = await authApi.get<User[]>(`/auth/leads/${leadId}/agents`)
    return res.data
  },

  // ── Teams ─────────────────────────────────────────────────────────────────
  async createTeam(data: TeamCreateRequest): Promise<Team> {
    const res = await authApi.post<Team>('/admin/teams', data)
    return res.data
  },

  async listTeams(): Promise<TeamListResponse> {
    const res = await authApi.get<TeamListResponse>('/admin/teams')
    return res.data
  },

  async getTeam(teamId: string): Promise<Team> {
    const res = await authApi.get<Team>(`/admin/teams/${teamId}`)
    return res.data
  },

  async deleteTeam(teamId: string): Promise<void> {
    await authApi.delete(`/admin/teams/${teamId}`)
  },

  async addMember(teamId: string, data: AddMemberRequest): Promise<TeamMember> {
    const res = await authApi.post<TeamMember>(`/admin/teams/${teamId}/members`, data)
    return res.data
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    await authApi.delete(`/admin/teams/${teamId}/members/${userId}`)
  },
}