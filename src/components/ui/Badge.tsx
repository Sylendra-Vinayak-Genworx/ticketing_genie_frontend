import React from 'react'
import { cn } from '@/utils'
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  SEVERITY_CONFIG,
} from '@/config/constants'

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' }
  return (
    <span className={cn('badge', cfg.bg, cfg.color, className)}>
      {cfg.label}
    </span>
  )
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

interface PriorityBadgeProps {
  priority: string
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, color: 'text-gray-700', bg: 'bg-gray-100' }
  return (
    <span className={cn('badge', cfg.bg, cfg.color, className)}>
      {cfg.label}
    </span>
  )
}

// ─── Severity Badge ───────────────────────────────────────────────────────────

interface SeverityBadgeProps {
  severity: string
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const cfg = SEVERITY_CONFIG[severity] || { label: severity, color: 'text-gray-700', bg: 'bg-gray-100' }
  return (
    <span className={cn('badge', cfg.bg, cfg.color, className)}>
      {cfg.label}
    </span>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700',
  support_agent: 'bg-purple-100 text-purple-700',
  team_lead: 'bg-orange-100 text-orange-700',
  admin: 'bg-red-100 text-red-700',
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Customer',
  support_agent: 'Support Agent',
  team_lead: 'Team Lead',
  admin: 'Admin',
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <span className={cn('badge', ROLE_STYLES[role] || 'bg-gray-100 text-gray-700', className)}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

// ─── Generic Badge ────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const VARIANT_STYLES: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', VARIANT_STYLES[variant], className)}>
      {children}
    </span>
  )
}
