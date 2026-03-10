import { useEffect, useRef } from 'react'
import { TOKEN_KEYS } from '@/config/constants'
import { ENV } from '@/config/env'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { pushNotification, setConnected } from '../slices/notificationsSlice'
import type { SSENotification } from '../types'

const SSE_URL = `${ENV.TICKETING_API_URL}/notifications/stream`
const RECONNECT_DELAY_MS = 5_000

/**
 * Opens a persistent SSE connection to /notifications/stream once the user
 * is authenticated. Automatically reconnects on disconnect.
 * Dispatches pushNotification for every event received.
 *
 * Mount this once inside DashboardLayout so it lives for the entire session.
 */
export function useSSENotifications() {
  const dispatch    = useAppDispatch()
  const isAuth      = useAppSelector((s) => s.auth.isAuthenticated)
  const esRef       = useRef<EventSource | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuth) return

    function connect() {
      // EventSource doesn't support custom headers — pass the token as a
      // query param. The backend reads it from ?token= if Authorization
      // header is absent. (Add that fallback to JWTMiddleware if not yet done.)
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
      const url   = token ? `${SSE_URL}?token=${token}` : SSE_URL

      const es = new EventSource(url)
      esRef.current = es

      es.onopen = () => {
        dispatch(setConnected(true))
      }

      es.onmessage = (event) => {
        // Skip SSE keep-alive comments (": ping")
        if (!event.data || event.data.trim() === '') return
        try {
          const payload: SSENotification = JSON.parse(event.data)
          dispatch(pushNotification(payload))
        } catch {
          // malformed frame — ignore
        }
      }

      es.onerror = () => {
        dispatch(setConnected(false))
        es.close()
        esRef.current = null
        // Reconnect after delay
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      esRef.current = null
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      dispatch(setConnected(false))
    }
  }, [isAuth, dispatch])
}