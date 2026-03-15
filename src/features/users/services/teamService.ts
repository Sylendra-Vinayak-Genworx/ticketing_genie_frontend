import { authApi } from '@/lib/axios'
import type {
  Team, TeamListResponse, TeamCreateRequest, AddMemberRequest, TeamMember,
} from '@/types'

export const teamService = {
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
