import { ticketingApi } from '@/lib/axios'

export const notificationsService = {
  /**
   * Mark all notifications as read for the current user.
   */
  async markAllRead(): Promise<{ count: number }> {
    const response = await ticketingApi.patch('/notifications/read-all')
    return response.data
  },

  /**
   * Mark a specific notification as read.
   */
  async markRead(notificationId: string): Promise<{ success: boolean }> {
    const response = await ticketingApi.patch(`/notifications/${notificationId}/read`)
    return response.data
  },
}
