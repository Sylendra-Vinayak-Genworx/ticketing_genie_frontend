import type { MatchField, Severity } from '@/types'

// ─── Keyword Rule Types ───────────────────────────────────────────────────────

export interface KeywordRule {
  keyword_rule_id: number
  keyword: string
  match_field: MatchField
  target_severity: Severity
  is_active: boolean
  created_at: string
}

export interface CreateKeywordRuleRequest {
  keyword: string
  match_field: MatchField
  target_severity: Severity
  is_active: boolean
}

export interface UpdateKeywordRuleRequest {
  keyword?: string
  match_field?: MatchField
  target_severity?: Severity
  is_active?: boolean
}
