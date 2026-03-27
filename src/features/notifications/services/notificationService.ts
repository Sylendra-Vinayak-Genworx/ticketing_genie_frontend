import { ENV } from '@/config/env';
import { store } from '@/app/store';

const BASE_URL = `${ENV.TICKETING_API_URL}/notifications`;

/**
 * Service for interacting with the notification backend.
 */
export const notificationService = {
  /**
   * Mark a single notification as read on the backend.
   */
  async markAsRead(notificationId: number): Promise<boolean> {
    const token = (store.getState() as any).auth.access_token;
    if (!token) return false;

    try {
      const res = await fetch(`${BASE_URL}/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.ok;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  },

  /**
   * Mark ALL notifications as read on the backend.
   */
  async markAllAsRead(): Promise<boolean> {
    const token = (store.getState() as any).auth.access_token;
    if (!token) return false;

    try {
      const res = await fetch(`${BASE_URL}/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.ok;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  },
};
