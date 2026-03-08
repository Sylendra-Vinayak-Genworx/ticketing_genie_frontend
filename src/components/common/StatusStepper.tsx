import React from 'react'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { cn } from '@/utils'
import type { TicketEvent } from '@/types'
import { formatRelative } from '@/utils'
import { Avatar } from '@/components/ui/Avatar'

interface StatusStepperProps {
  events: TicketEvent[]
  userNames?: Record<string, string>
}

const EVENT_LABELS: Record<string, string> = {
  CREATED: 'Ticket Created',
  STATUS_CHANGED: 'Status Changed',
  ASSIGNED: 'Assigned',
  PRIORITY_CHANGED: 'Priority Changed',
  SEVERITY_CHANGED: 'Severity Changed',
  SLA_BREACHED: 'SLA Breached',
  ESCALATED: 'Escalated',
  COMMENT_ADDED: 'Comment Added',
  REOPENED: 'Reopened',
  CLOSED: 'Closed',
}

const EVENT_COLORS: Record<string, string> = {
  CREATED: 'text-blue-600 bg-blue-100',
  STATUS_CHANGED: 'text-indigo-600 bg-indigo-100',
  ASSIGNED: 'text-purple-600 bg-purple-100',
  SLA_BREACHED: 'text-red-600 bg-red-100',
  ESCALATED: 'text-orange-600 bg-orange-100',
  RESOLVED: 'text-green-600 bg-green-100',
  CLOSED: 'text-gray-600 bg-gray-100',
}

export function StatusStepper({ events, userNames = {} }: StatusStepperProps) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, i) => (
          <li key={event.event_id}>
            <div className="relative pb-8">
              {i < events.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white flex-shrink-0',
                    EVENT_COLORS[event.event_type] || 'text-gray-600 bg-gray-100'
                  )}
                >
                  {i === events.length - 1 ? (
                    <Circle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {EVENT_LABELS[event.event_type] || event.event_type}
                      {event.old_value && event.new_value && (
                        <span className="font-normal text-gray-500">
                          {' '}: {event.old_value} → <span className="font-medium text-gray-800">{event.new_value}</span>
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelative(event.created_at)}
                    </span>
                  </div>
                  {event.triggered_by_user_id && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      by {userNames[event.triggered_by_user_id] || event.triggered_by_user_id.slice(0, 8) + '…'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
