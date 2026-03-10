import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { NotificationItem, SSENotification } from '../types'

interface NotificationsState {
  items: NotificationItem[]
  connected: boolean
}

const initialState: NotificationsState = {
  items: [],
  connected: false,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification(state, action: PayloadAction<SSENotification>) {
      state.items.unshift({
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
      })
      // Keep at most 50 notifications in memory
      if (state.items.length > 50) state.items = state.items.slice(0, 50)
    },
    markAllRead(state) {
      state.items.forEach((n) => { n.read = true })
    },
    markRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload)
      if (item) item.read = true
    },
    clearAll(state) {
      state.items = []
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload
    },
  },
})

export const {
  pushNotification,
  markAllRead,
  markRead,
  clearAll,
  setConnected,
} = notificationsSlice.actions

export default notificationsSlice.reducer