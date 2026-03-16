import React from 'react'
import {
  CheckCircle2, Circle, Clock, User2, Bot, AlertTriangle,
  ArrowRightLeft, UserCheck, MessageSquare, TrendingUp, PlusCircle,
} from 'lucide-react'
import { cn } from '@/utils'
import type { TicketEvent } from '@/types'
import { formatRelative } from '@/utils'

interface StatusStepperProps {
  events: TicketEvent[]
  userNames?: Record<string, string>
}

// UUID pattern — used to detect when new_value/old_value is a user ID
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUUID(value: string | null): boolean {
  return !!value && UUID_RE.test(value)
}

/** Resolve a value: if it looks like a UUID, look it up in userNames; otherwise format as status label */
function resolveValue(value: string | null, userNames: Record<string, string>): string {
  if (!value) return ''
  if (isUUID(value)) {
    return userNames[value] || value.slice(0, 8) + '…'
  }
  // Status/field value — replace underscores with spaces
  return value.replace(/_/g, ' ')
}

function deduplicateEvents(events: TicketEvent[]): TicketEvent[] {
  if (events.length < 2) return events
  const result: TicketEvent[] = []
  let i = 0
  while (i < events.length) {
    const ev   = events[i]
    const next = events[i + 1]
    if (
      ev.event_type === 'STATUS_CHANGED' &&
      ev.new_value === 'NEW' &&
      next?.event_type === 'STATUS_CHANGED' &&
      next.old_value === 'NEW' &&
      next.new_value === 'ACKNOWLEDGED' &&
      !next.triggered_by_user_id
    ) {
      result.push({
        ...ev,
        event_type: 'CREATED' as any,
        old_value: null,
        new_value: 'ACKNOWLEDGED',
        ...({ reason: 'Ticket created and acknowledged' }),
      } as any)
      i += 2
      continue
    }
    result.push(ev)
    i++
  }
  return result
}

const EVENT_META: Record<string, {
  label: string; icon: React.ElementType; color: string; bg: string
}> = {
  CREATED:        { label: 'Ticket Created',  icon: PlusCircle,     color: 'text-blue-600',   bg: 'bg-blue-100'   },
  STATUS_CHANGED: { label: 'Status Changed',  icon: ArrowRightLeft, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ASSIGNED:       { label: 'Assigned to',     icon: UserCheck,      color: 'text-purple-600', bg: 'bg-purple-100' },
  SLA_BREACHED:   { label: 'SLA Breached',    icon: AlertTriangle,  color: 'text-red-600',    bg: 'bg-red-100'    },
  ESCALATED:      { label: 'Escalated',       icon: TrendingUp,     color: 'text-orange-600', bg: 'bg-orange-100' },
  COMMENT_ADDED:  { label: 'Comment Added',   icon: MessageSquare,  color: 'text-gray-600',   bg: 'bg-gray-100'   },
  RESOLVED:       { label: 'Resolved',        icon: CheckCircle2,   color: 'text-green-600',  bg: 'bg-green-100'  },
  CLOSED:         { label: 'Closed',          icon: CheckCircle2,   color: 'text-gray-600',   bg: 'bg-gray-100'   },
}

function actorLabel(event: TicketEvent, userNames: Record<string, string>): React.ReactNode {
  if (!event.triggered_by_user_id) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400">
        <Bot className="w-3 h-3" /> System
      </span>
    )
  }
  const name = userNames[event.triggered_by_user_id] || event.triggered_by_user_id.slice(0, 8) + '…'
  return (
    <span className="inline-flex items-center gap-1 text-gray-500">
      <User2 className="w-3 h-3" /> {name}
    </span>
  )
}

export function StatusStepper({ events, userNames = {} }: StatusStepperProps) {
  const deduplicated = deduplicateEvents(events)

  if (deduplicated.length === 0) {
    return <div className="py-8 text-center text-gray-400 text-sm">No timeline events yet.</div>
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {deduplicated.map((event, i) => {
          const meta   = EVENT_META[event.event_type] || { label: event.event_type, icon: Circle, color: 'text-gray-600', bg: 'bg-gray-100' }
          const Icon   = meta.icon
          const isLast = i === deduplicated.length - 1

          // Resolve old/new values — UUIDs become names, statuses become readable labels
          const resolvedOld = resolveValue(event.old_value, userNames)
          const resolvedNew = resolveValue(event.new_value, userNames)

          // For ASSIGNED events with no old_value, show just the assignee name
          const showTransition = !!(event.old_value && event.new_value)
          const showNewOnly    = !event.old_value && event.new_value && event.event_type !== 'CREATED'

          return (
            <li key={event.event_id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true" />
                )}
                <div className="relative flex items-start space-x-3">
                  {/* Icon bubble */}
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white flex-shrink-0', meta.bg, meta.color)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {meta.label}
                        {showTransition && (
                          <span className="font-normal text-gray-500">
                            {' '}
                            <span className="font-medium text-gray-600">{resolvedOld}</span>
                            {' → '}
                            <span className="font-semibold text-gray-800">{resolvedNew}</span>
                          </span>
                        )}
                        {showNewOnly && (
                          <span className="font-normal text-gray-500">
                            {' '}
                            <span className="font-semibold text-gray-800">{resolvedNew}</span>
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelative(event.created_at)}
                      </span>
                    </div>

                    <p className="text-xs mt-0.5">
                      by {actorLabel(event, userNames)}
                    </p>

                    {(event as any).reason &&
                      (event as any).reason !== 'Ticket created' &&
                      (event as any).reason !== 'Automatic acknowledgement on creation' && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        "{(event as any).reason}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}