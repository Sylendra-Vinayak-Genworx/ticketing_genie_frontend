import { format, formatDistanceToNow, parseISO, isValid, differenceInMinutes } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'

// ─── Class Names ──────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return '—'
    return format(date, 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return '—'
    return format(date, 'MMM d, yyyy h:mm a')
  } catch {
    return '—'
  }
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return '—'
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return '—'
  }
}

export function getSLAStatus(
  dueAt: string | null | undefined,
  status: string
): 'ok' | 'warning' | 'breached' | 'na' {
  if (['RESOLVED', 'CLOSED'].includes(status)) return 'na'
  if (!dueAt) return 'na'
  const due = parseISO(dueAt)
  if (!isValid(due)) return 'na'
  const minsRemaining = differenceInMinutes(due, new Date())
  if (minsRemaining < 0) return 'breached'
  if (minsRemaining < 30) return 'warning'
  return 'ok'
}

export function getSLARemaining(dueAt: string | null | undefined): string {
  if (!dueAt) return '—'
  const due = parseISO(dueAt)
  if (!isValid(due)) return '—'
  const mins = differenceInMinutes(due, new Date())
  if (mins < 0) {
    const absMins = Math.abs(mins)
    const h = Math.floor(absMins / 60)
    const m = absMins % 60
    return h > 0 ? `-${h}h ${m}m` : `-${m}m`
  }
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function getSLAPercent(
  dueAt: string | null | undefined,
  createdAt: string | null | undefined
): number {
  if (!dueAt || !createdAt) return 0
  const due = parseISO(dueAt)
  const created = parseISO(createdAt)
  if (!isValid(due) || !isValid(created)) return 0
  const total = differenceInMinutes(due, created)
  const elapsed = differenceInMinutes(new Date(), created)
  if (total <= 0) return 100
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

// ─── String Utilities ─────────────────────────────────────────────────────────

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function formatRole(role: string): string {
  const map: Record<string, string> = {
    user: 'Customer',
    support_agent: 'Support Agent',
    team_lead: 'Team Lead',
    admin: 'Admin',
  }
  return map[role] || role
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}

// ─── Avatar Color ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
]

export function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ─── Number Utilities ─────────────────────────────────────────────────────────

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatPercent(val: number): string {
  return `${val.toFixed(1)}%`
}
