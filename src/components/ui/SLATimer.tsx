import React, { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, MinusCircle } from 'lucide-react'
import { getSLAStatus, getSLARemaining, getSLAPercent } from '@/utils'
import { cn } from '@/utils'

interface SLATimerProps {
  dueAt: string | null | undefined
  createdAt?: string | null
  status: string
  compact?: boolean
}

const STATUS_STYLES = {
  ok: {
    bar: 'bg-green-500',
    text: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
    label: 'SLA Remaining',
  },
  warning: {
    bar: 'bg-yellow-500',
    text: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: Clock,
    label: 'SLA Remaining',
  },
  breached: {
    bar: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
    label: 'SLA Breached',
  },
  resolved: {
    bar: 'bg-green-400',
    text: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
    label: 'SLA Resolved',
  },
  not_started: {
    bar: 'bg-gray-200',
    text: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: MinusCircle,
    label: 'No SLA',
  },
}

export function SLATimer({ dueAt, createdAt, status, compact = false }: SLATimerProps) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  const slaStatus = getSLAStatus(dueAt, status)
  const remaining = getSLARemaining(dueAt)
  const pct = getSLAPercent(dueAt, createdAt)
  const styles = STATUS_STYLES[slaStatus]
  const Icon = styles.icon

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium',
          styles.bg,
          styles.border,
          styles.text,
          slaStatus === 'breached' && 'sla-breached',
        )}
      >
        <Icon className="w-3 h-3" />
        {slaStatus === 'resolved' ? 'SLA Resolved'
          : slaStatus === 'not_started' ? 'No SLA'
          : remaining}
      </div>
    )
  }

  return (
    <div className={cn('p-3 rounded-xl border', styles.bg, styles.border)}>
      <div className="flex items-center justify-between mb-2">
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide',
            styles.text,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {styles.label}
        </div>
        <span
          className={cn(
            'text-sm font-bold',
            styles.text,
            slaStatus === 'breached' && 'sla-breached',
          )}
        >
          {slaStatus === 'resolved' ? '✓'
            : slaStatus === 'not_started' ? '—'
            : remaining}
        </span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', styles.bar)}
          style={{ width: `${slaStatus === 'not_started' ? 0 : Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}