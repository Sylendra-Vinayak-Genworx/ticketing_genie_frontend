import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { ENV } from '@/config/env'
 
import { store } from '@/app/store'
import { logout, refreshTokenThunk } from '@/features/auth/slices/authSlice'

// ─── Auth Service Instance ────────────────────────────────────────────────────

export const authApi = axios.create({
  baseURL: ENV.AUTH_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Ticketing Service Instance ───────────────────────────────────────────────

export const ticketingApi = axios.create({
  baseURL: ENV.TICKETING_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor (Attach Token) ──────────────────────────────────────

function attachToken(config: InternalAxiosRequestConfig) {
  const token = store.getState().auth.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

authApi.interceptors.request.use(attachToken)
ticketingApi.interceptors.request.use(attachToken)

// ─── Response Interceptor (Handle 401 — Refresh & Retry) ─────────────────────

/**
 * Paths that must NEVER trigger a refresh attempt.
 * These are auth-internal endpoints; refreshing on their failure would cause
 * a recursive loop (e.g. failed login → refresh → failed refresh → logout).
 */
const AUTH_SKIP_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/signup',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
]

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) return false
  return AUTH_SKIP_PATHS.some(path => url.includes(path))
}

// FIX: each instance gets its own isRefreshing flag and failedQueue.
// Previously both instances shared a single module-level flag, so a 401 on
// a ticketing request could block or mis-resolve retries queued from an auth
// request, and vice versa.
function addRefreshInterceptor(instance: typeof ticketingApi) {
  let isRefreshing = false
  let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
  }> = []

  function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach((p) => {
      if (error) p.reject(error)
      else p.resolve(token!)
    })
    failedQueue = []
  }

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      // Skip refresh for auth-internal endpoints to avoid recursive loops
      if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url)) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return instance(originalRequest)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const result = await store.dispatch(refreshTokenThunk())
          if (refreshTokenThunk.fulfilled.match(result)) {
            const newToken = result.payload.access_token
            processQueue(null, newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return instance(originalRequest)
          } else {
            processQueue(error, null)
            store.dispatch(logout())
            return Promise.reject(error)
          }
        } catch (refreshError) {
          processQueue(refreshError, null)
          store.dispatch(logout())
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    }
  )
}

// Apply refresh interceptor to BOTH API instances.
// Auth-internal endpoints (login, refresh, signup, etc.) are excluded via
// shouldSkipRefresh() to prevent recursive refresh loops.
addRefreshInterceptor(authApi)
addRefreshInterceptor(ticketingApi)