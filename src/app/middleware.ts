import { Middleware } from '@reduxjs/toolkit'

// ─── Logger Middleware ────────────────────────────────────────────────────────

export const loggerMiddleware: Middleware = (store) => (next) => (action: any) => {
  if (import.meta.env.DEV) {
    console.group(`[Action] ${action.type}`)
    console.log('Payload:', action.payload)
    console.groupEnd()
  }
  return next(action)
}

// ─── Auth Middleware (schedule token refresh) ─────────────────────────────────

export const authMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action)

  if (action.type === 'auth/login/fulfilled') {
    const expiresIn = action.payload.tokens.expires_in
    const refreshAt = (expiresIn - 60) * 1000 // 1 min before expiry

    setTimeout(async () => {
      const { refreshTokenThunk } = await import('@/features/auth/slices/authSlice')
      const state = store.getState() as any
      if (state.auth.isAuthenticated) {
        store.dispatch(refreshTokenThunk() as any)
      }
    }, refreshAt)
  }

  return result
}
