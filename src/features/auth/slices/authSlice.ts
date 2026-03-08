import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService } from '../services/authService'
import { TOKEN_KEYS } from '@/config/constants'
import type { AuthState, LoginRequest, SignupRequest, User } from '@/types'

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const tokens = await authService.login(credentials)
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.access_token)
      const expiry = Date.now() + tokens.expires_in * 1000
      localStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, String(expiry))
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
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.access_token)
      const expiry = Date.now() + tokens.expires_in * 1000
      localStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, String(expiry))
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

const storedToken = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)

const initialState: AuthState = {
  user: null,
  access_token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
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
      localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRY)
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
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.user = null
        state.access_token = null
        state.isAuthenticated = false
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
        state.isLoading = false
        state.isAuthenticated = false
        state.access_token = null
        localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN)
      })
  },
})

export const { logout, clearError, setUser } = authSlice.actions
export default authSlice.reducer
