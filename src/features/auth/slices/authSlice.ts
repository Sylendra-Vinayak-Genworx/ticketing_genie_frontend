import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService } from '../services/authService'
import type { AuthState, LoginRequest, SignupRequest, User } from '@/types'

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue, dispatch }) => {
    try {
      const tokens = await authService.login(credentials)

      // Make the freshly received access token available to Axios interceptors
      // (which read from Redux state) before calling authenticated endpoints.
      dispatch({ type: 'auth/setAccessToken', payload: tokens.access_token } as any)

      const user = await authService.getMe()
      return { tokens, user }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Login failed')
    }
  }
)

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async (data: SignupRequest, { rejectWithValue }) => {
    try {
      return await authService.signup(data)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Signup failed')
    }
  }
)

export const refreshTokenThunk = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const tokens = await authService.refresh()
      return tokens
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Token refresh failed')
    }
  }
)

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { getState, dispatch }) => {
    const state = getState() as { auth: AuthState }
    const token = state.auth.access_token
    try {
      if (token) await authService.logout(token)
    } catch {
      // ignore errors on logout
    } finally {
      dispatch(logout())
    }
  }
)

export const getMeThunk = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe()
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to get user')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────
// Access tokens are not persisted in localStorage. Session restoration is
// handled via HTTP-only refresh_cookie flow in AuthInitializer/axios.
const initialState: AuthState = {
  user: null,
  access_token: null,
  isAuthenticated: false,
  isLoading: true, // attempt silent refresh on app start
  error: null,
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.access_token = null
      state.isAuthenticated = false
      state.error = null
      state.isLoading = false
    },
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.access_token = action.payload
    },
    clearError(state) {
      state.error = null
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.access_token = action.payload.tokens.access_token
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Refresh
    builder
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.access_token = action.payload.access_token
        state.isAuthenticated = true
        state.isLoading = false
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.user = null
        state.access_token = null
        state.isAuthenticated = false
        state.isLoading = false
      })

    // GetMe
    builder
      .addCase(getMeThunk.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isLoading = false
      })
      .addCase(getMeThunk.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getMeThunk.rejected, (state) => {
        // Don't clear isAuthenticated here — the axios interceptor may still
        // be refreshing the token and retrying. Only explicit logout or
        // refreshTokenThunk.rejected should clear auth state.
        state.isLoading = false
      })
  },
})

export const { logout, clearError, setUser, setAccessToken } = authSlice.actions
export default authSlice.reducer