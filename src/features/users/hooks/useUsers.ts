import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { userService } from '../services/userService'
import type { User, UserUpdateRequest } from '@/types'

const STAFF_ROLES = ['admin', 'team_lead', 'support_agent']

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const allUsers = await userService.getAllUsers()
      setUsers(allUsers.filter(u => STAFF_ROLES.includes(u.role)))
    } catch {
      toast.error('Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const updateUser = async (userId: string, data: UserUpdateRequest): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await userService.updateUser(userId, data)
      toast.success('User updated successfully')
      await loadUsers()
      return true
    } catch {
      toast.error('Failed to update user')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { users, isLoading, isSubmitting, updateUser, reload: loadUsers }
}
