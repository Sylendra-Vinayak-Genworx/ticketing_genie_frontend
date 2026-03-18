import type { Severity, Priority } from '@/types'

// ─── SLA Types ────────────────────────────────────────────────────────────────

export interface SLARule {
  rule_id: number
  sla_id: number
  severity: Severity
  priority: Priority
  response_time_minutes: number
  resolution_time_minutes: number
  escalation_after_minutes: number
}

export interface SLA {
  sla_id: number
  name: string
  customer_tier_id: number
  is_active: boolean
  created_at: string
  rules: SLARule[]
}

export interface CreateSLARequest {
  name: string
  customer_tier_id: number
  is_active: boolean
}

export interface CreateSLARuleRequest {
  severity: Severity
  priority: Priority
  response_time_minutes: number
  resolution_time_minutes: number
  escalation_after_minutes: number
}

export interface UpdateSLARuleRequest {
  response_time_minutes?: number
  resolution_time_minutes?: number
  escalation_after_minutes?: number
}
