import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { teamService } from '../services/teamService'
import { userService } from '../services/userService'
import type { Team, User, TeamCreateRequest, AddMemberRequest } from '@/types'

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [teamsData, usersData] = await Promise.all([
        teamService.listTeams(),
        userService.getAllUsers(),
      ])
      setTeams(teamsData.teams)
      setAllUsers(usersData)
    } catch {
      toast.error('Failed to load teams')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createTeam = async (data: TeamCreateRequest): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await teamService.createTeam(data)
      toast.success(`Team "${data.name}" created`)
      await load()
      return true
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create team')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteTeam = async (team: Team): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await teamService.deleteTeam(team.id)
      toast.success(`Team "${team.name}" deleted`)
      await load()
      return true
    } catch {
      toast.error('Failed to delete team')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const addMember = async (teamId: string, data: AddMemberRequest): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await teamService.addMember(teamId, data)
      toast.success('Member added to team')
      await load()
      return true
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add member')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeMember = async (teamId: string, userId: string, name: string): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await teamService.removeMember(teamId, userId)
      toast.success(`${name} removed from team`)
      await load()
      return true
    } catch {
      toast.error('Failed to remove member')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    teams, allUsers, isLoading, isSubmitting,
    createTeam, deleteTeam, addMember, removeMember,
    reload: load,
  }
}
