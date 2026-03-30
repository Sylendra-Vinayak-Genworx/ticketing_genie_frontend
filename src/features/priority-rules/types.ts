import type { Priority, Severity } from '@/types'

// ─── Priority Rule Types ──────────────────────────────────────────────────────

export interface PriorityRule {
  rule_id: number
  severity: Severity
  tier_name: string
  priority: Priority
}

export interface CreatePriorityRuleRequest {
  severity: Severity
  tier_name: string
  priority: Priority
}

export interface UpdatePriorityRuleRequest {
  priority: Priority
}
