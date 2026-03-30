// ─── Analytics Types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  on_hold_tickets: number
  resolved_tickets: number
  closed_tickets: number
  breached_tickets: number
  escalated_tickets: number
}

export interface DistributionItem {
  label: string
  count: number
}

export interface SLACompliance {
  total_tickets: number
  response_sla_met: number
  response_sla_breached: number
  resolution_sla_met: number
  resolution_sla_breached: number
  response_compliance_pct: number
  resolution_compliance_pct: number
}

export interface AgentPerformance {
  agent_user_id: string
  display_name: string
  total_assigned: number
  total_resolved: number
  total_breached: number
  avg_resolution_minutes: number
}

export interface TeamComparison {
  team_name: string
  total_tickets: number
  resolved_tickets: number
  breached_tickets: number
}

export interface DashboardData {
  data_scope: 'GLOBAL' | 'TEAM'
  summary: DashboardSummary
  distribution: {
    by_status: DistributionItem[]
    by_severity: DistributionItem[]
    by_priority: DistributionItem[]
    by_product: DistributionItem[]
  }
  sla_compliance: SLACompliance
  top_agents: AgentPerformance[]
  team_comparison: TeamComparison[]
}

export interface CustomerReport {
  customer_id: string
  total_tickets: number
  open_tickets: number
  resolved_tickets: number
  breached_tickets: number
}
