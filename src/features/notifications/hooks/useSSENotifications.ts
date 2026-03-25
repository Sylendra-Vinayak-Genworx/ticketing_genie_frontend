import { useEffect, useRef } from 'react'
import { ENV } from '@/config/env'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { pushNotification, setConnected } from '../slices/notificationsSlice'
import { refreshTokenThunk, logout } from '@/features/auth/slices/authSlice'
import { store } from '@/app/store'
import type { SSENotification } from '../types'

const SSE_URL     = `${ENV.TICKETING_API_URL}/notifications/stream`
const UNREAD_URL  = `${ENV.TICKETING_API_URL}/notifications/unread`
const RECONNECT_DELAY_MS = 5_000

/**
 * Opens a persistent SSE connection to /notifications/stream once the user
 * is authenticated. Automatically reconnects on disconnect.
 *
 * On every successful (re)connect, calls /notifications/unread to backfill
 * any notifications missed while the user was offline, then dispatches them
 * into notificationsSlice oldest-first so the newest ends up at the top.
 *
 * On reconnect, refreshes the access token first so the new EventSource
 * never sends an expired ?token=. If refresh fails the user is logged out
 * and reconnection stops.
 */
export function useSSENotifications() {
  const dispatch        = useAppDispatch()
  const isAuth          = useAppSelector((s) => s.auth.isAuthenticated)
  const esRef           = useRef<EventSource | null>(null)
  const reconnectRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prevent concurrent reconnect attempts
  const reconnectingRef = useRef(false)

  useEffect(() => {
    if (!isAuth) return

    // ── Backfill missed notifications ──────────────────────────────────────
    // Called on every successful onopen. Fetches the last 24 h of persisted
    // IN_APP notifications from the backend and replays them into Redux.
    // Failures are swallowed — live notifications still work without this.
    async function fetchMissed(token: string) {
      try {
        const res = await fetch(UNREAD_URL, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return

        const data: { notifications: SSENotification[]; count: number } = await res.json()

        // Backend returns newest-first; reverse so we unshift oldest-first
        // and the final Redux order is still newest-at-top.
        const oldest_first = [...data.notifications].reverse()
        oldest_first.forEach((n) => dispatch(pushNotification(n)))
      } catch {
        // non-fatal — ignore
      }
    }

    // ── SSE connection ─────────────────────────────────────────────────────
    function connect() {
      // Always read the freshest access token from Redux at connection time
      const token = (store.getState() as any).auth.access_token as string | null
      if (!token) return

      const url = `${SSE_URL}?token=${encodeURIComponent(token)}`
      const es  = new EventSource(url)
      esRef.current = es

      es.onopen = () => {
        dispatch(setConnected(true))
        reconnectingRef.current = false
        fetchMissed(token)
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