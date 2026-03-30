import { useAppDispatch } from '@/hooks'
import { markAllRead, markRead } from '../slices/notificationsSlice'
import { notificationsService } from '../services/notificationsService'

export function useNotificationActions() {
  const dispatch = useAppDispatch()

  const handleMarkAllRead = async () => {
    // Optimistic UI update
    dispatch(markAllRead())
    
    try {
      // Persist to backend
      await notificationsService.markAllRead()
    } catch {
      // In a more robust system, we would revert the optimistic update or show a toast
      console.error('Failed to mark all notifications as read on the backend.')
    }
  }

  const handleMarkRead = async (id: string) => {
    // Optimistic UI update
    dispatch(markRead(id))
    
    try {
      // Persist to backend
      await notificationsService.markRead(id)
    } catch {
      console.error(`Failed to mark notification ${id} as read on the backend.`)
    }
  }

  return {
    handleMarkAllRead,
    handleMarkRead
  }
}
