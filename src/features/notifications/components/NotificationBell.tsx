import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Trash2, Ticket, AlertTriangle,
  Clock, MessageSquare, UserCheck, X, Wifi, WifiOff,
} from 'lucide-react'
import { cn } from '@/utils'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { markAllRead, markRead, clearAll } from '../slices/notificationsSlice'
import type { NotificationItem, NotificationEventType } from '../types'
import { formatDistanceToNow, parseISO } from 'date-fns'

// ── Icon + colour per event type ─────────────────────────────────────────────

const EVENT_META: Record<
  NotificationEventType,
  { icon: React.ElementType; bg: string; text: string; label: string }
> = {
  TICKET_CREATED:   { icon: Ticket,       bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'New Ticket' },
  STATUS_CHANGED:   { icon: Clock,        bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Status Update' },
  AGENT_COMMENT:    { icon: MessageSquare,bg: 'bg-indigo-100', text: 'text-indigo-600', label: 'Agent Reply' },
  CUSTOMER_COMMENT: { icon: MessageSquare,bg: 'bg-sky-100',    text: 'text-sky-600',    label: 'Customer Reply' },
  TICKET_ASSIGNED:  { icon: UserCheck,    bg: 'bg-green-100',  text: 'text-green-600',  label: 'Assigned' },
  SLA_BREACHED:     { icon: AlertTriangle,bg: 'bg-red-100',    text: 'text-red-600',    label: 'SLA Breach' },
  AUTO_CLOSED:      { icon: X,            bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Auto Closed' },
}

// ── Single notification row ───────────────────────────────────────────────────

function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem
  onRead: (id: string) => void
}) {
  const navigate = useNavigate()
  const meta = EVENT_META[item.type] ?? EVENT_META.STATUS_CHANGED
  const Icon = meta.icon

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })
    } catch {
      return ''
    }
  })()

  function handleClick() {
    onRead(item.id)
    if (item.ticket_id) navigate(`/tickets/${item.ticket_id}`)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50',
        !item.read && 'bg-blue-50/60 hover:bg-blue-50',
      )}
    >
      {/* Icon bubble */}
      <div className={cn('mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', meta.bg)}>
        <Icon className={cn('w-3.5 h-3.5', meta.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-xs font-semibold', meta.text)}>{meta.label}</span>
          {item.ticket_number && (
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">{item.ticket_number}</span>
          )}
        </div>
        <p className="text-sm text-gray-700 mt-0.5 leading-snug line-clamp-2">{item.message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {/* Unread dot */}
      {!item.read && (
        <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
      )}
    </button>
  )
}

// ── Main bell component ───────────────────────────────────────────────────────

export function NotificationBell() {
  const dispatch    = useAppDispatch()
  const items       = useAppSelector((s) => s.notifications.items)
  const connected   = useAppSelector((s) => s.notifications.connected)
  const unreadCount = items.filter((n) => !n.read).length

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Mark all read when opening
  function handleOpen() {
    setOpen((v) => !v)
  }

  function handleMarkAllRead() {
    dispatch(markAllRead())
  }

  function handleClear() {
    dispatch(clearAll())
  }

  function handleRead(id: string) {
    dispatch(markRead(id))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection dot */}
        <span
          className={cn(
            'absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-white',
            connected ? 'bg-green-400' : 'bg-gray-300',
            unreadCount > 0 && 'hidden',   // hidden when badge is showing
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {connected ? (
                <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                  <Wifi className="w-3 h-3" /> Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              {items.length > 0 && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1 text-gray-300">Events will appear here in real time</p>
              </div>
            ) : (
              items.map((item) => (
                <NotificationRow key={item.id} item={item} onRead={handleRead} />
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                {items.length} notification{items.length !== 1 ? 's' : ''}
                {unreadCount > 0 && ` · ${unreadCount} unread`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}