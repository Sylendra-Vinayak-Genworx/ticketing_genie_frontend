import { useEffect, useRef } from 'react'
import { TOKEN_KEYS } from '@/config/constants'
import { ENV } from '@/config/env'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { pushNotification, setConnected } from '../slices/notificationsSlice'
import { refreshTokenThunk, logout } from '@/features/auth/slices/authSlice'
import { store } from '@/app/store'
import type { SSENotification } from '../types'

const SSE_URL = `${ENV.TICKETING_API_URL}/notifications/stream`
const RECONNECT_DELAY_MS = 5_000

/**
 * Opens a persistent SSE connection to /notifications/stream once the user
 * is authenticated. Automatically reconnects on disconnect.
 *
 * On reconnect, refreshes the access token first so the new EventSource
 * never sends an expired ?token=. If refresh fails the user is logged out
 * and reconnection stops.
 */
export function useSSENotifications() {
  const dispatch     = useAppDispatch()
  const isAuth       = useAppSelector((s) => s.auth.isAuthenticated)
  const esRef        = useRef<EventSource | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prevent concurrent reconnect attempts
  const reconnectingRef = useRef(false)

  useEffect(() => {
    if (!isAuth) return

    function connect() {
      // Always read the freshest token from storage at connection time
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
      if (!token) return

      const url = `${SSE_URL}?token=${encodeURIComponent(token)}`
      const es  = new EventSource(url)
      esRef.current = es

      es.onopen = () => {
        dispatch(setConnected(true))
        reconnectingRef.current = false
      }

      es.onmessage = (event) => {
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

        // Guard against multiple simultaneous reconnect chains
        if (reconnectingRef.current) return
        reconnectingRef.current = true

        reconnectRef.current = setTimeout(async () => {
          // Refresh the access token before reconnecting so we never
          // open a new EventSource with an already-expired token.
          try {
            const result = await store.dispatch(refreshTokenThunk())
            if (refreshTokenThunk.fulfilled.match(result)) {
              // Token refreshed — reconnect with the new one
              connect()
            } else {
              // Refresh rejected (e.g. refresh token also expired)
              store.dispatch(logout())
              reconnectingRef.current = false
            }
          } catch {
            store.dispatch(logout())
            reconnectingRef.current = false
          }
        }, RECONNECT_DELAY_MS)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      esRef.current = null
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      dispatch(setConnected(false))
      reconnectingRef.current = false
    }
  }, [isAuth, dispatch])
}