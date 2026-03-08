import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { ENV } from '@/config/env'
import { TOKEN_KEYS } from '@/config/constants'
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
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

authApi.interceptors.request.use(attachToken)
ticketingApi.interceptors.request.use(attachToken)

// ─── Response Interceptor (Handle 401 — Refresh & Retry) ─────────────────────

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

function addRefreshInterceptor(instance: typeof ticketingApi) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (error.response?.status === 401 && !originalRequest._retry) {
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

addRefreshInterceptor(ticketingApi)
addRefreshInterceptor(authApi)
