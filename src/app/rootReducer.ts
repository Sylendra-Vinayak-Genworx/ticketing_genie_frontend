import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/slices/authSlice'
import ticketsReducer from '@/features/tickets/slices/ticketsSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  tickets: ticketsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer
