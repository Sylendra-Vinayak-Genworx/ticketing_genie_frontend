import { useAppSelector, useAppDispatch } from '@/hooks'
import { loginThunk, logoutThunk, signupThunk, clearError } from '../slices/authSlice'
import type { LoginRequest, SignupRequest } from '@/types'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading, error, access_token } = useAppSelector(
    (s) => s.auth
  )

  const login = (credentials: LoginRequest) => dispatch(loginThunk(credentials))
  const signup = (data: SignupRequest) => dispatch(signupThunk(data))
  const logout = () => dispatch(logoutThunk())
  const clear = () => dispatch(clearError())

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    access_token,
    login,
    signup,
    logout,
    clearError: clear,
  }
}
