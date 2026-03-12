import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/slices/authSlice'
import ticketsReducer from '@/features/tickets/slices/ticketsSlice'
import escalatedTicketsReducer from '@/features/tickets/slices/ Escalatedticketsslice'
import notificationsReducer from '@/features/notifications/slices/notificationsSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  tickets: ticketsReducer,
  escalatedTickets: escalatedTicketsReducer,
  notifications: notificationsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer