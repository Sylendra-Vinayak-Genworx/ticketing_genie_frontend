// ─── Auth Types ───────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'support_agent' | 'team_lead' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  lead_id: string | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
  expires_in: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  role?: UserRole
}

export interface AuthState {
  user: User | null
  access_token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// ─── Team Types ───────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
}

export interface Team {
  id: string
  name: string
  description: string | null
  lead_id: string | null
  members: TeamMember[]
}

export interface TeamListResponse {
  total: number
  teams: Team[]
}

export interface MemberCreateRequest {
  email: string
  full_name: string
  role: UserRole
}

export interface TeamCreateRequest {
  name: string
  description?: string
  members: MemberCreateRequest[]  // lead derived from whichever member has role team_lead
}

export interface AddMemberRequest {
  email: string
  full_name: string
  role: UserRole
}

// ─── Ticket Types ─────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'
export type Environment = 'PROD' | 'STAGE' | 'DEV'
export type TicketSource = 'UI' | 'EMAIL'
export type QueueType = 'DIRECT' | 'OPEN'
export type RoutingStatus = 'SUCCESS' | 'AI_FAILED'
export type MatchField = 'SUBJECT' | 'BODY' | 'BOTH'
export type EventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'PRIORITY_CHANGED'
  | 'SEVERITY_CHANGED'
  | 'SLA_BREACHED'
  | 'ESCALATED'
  | 'COMMENT_ADDED'
  | 'REOPENED'
  | 'CLOSED'

export interface TicketEvent {
  event_id: number
  ticket_id: number
  triggered_by_user_id: string
  event_type: EventType
  field_name: string | null
  old_value: string | null
  new_value: string | null
  comment_id: number | null
  created_at: string
}

export interface TicketComment {
  comment_id: number
  ticket_id: number
  author_id: string
  author_role: UserRole
  body: string
  is_internal: boolean
  triggers_hold: boolean
  triggers_resume: boolean
  attachments: TicketAttachment[]
  created_at: string
}

export interface TicketAttachment {
  attachment_id: number
  ticket_id: number
  file_name: string
  file_url: string
  uploaded_by_user_id: string
  uploaded_at: string
}

export interface Ticket {
  ticket_id: number
  ticket_number: string
  title: string
  description: string
  product: string
  environment: Environment
  severity: Severity
  priority: Priority
  status: TicketStatus
  area_of_concern: string | null
  source: TicketSource
  customer_id: string
  assignee_id: string | null
  assigned_agent_id: number | null
  queue_type: QueueType
  routing_status: RoutingStatus
  sla_id: number | null
  customer_tier_id: number | null
  response_due_at: string | null
  resolution_due_at: string | null
  is_breached: boolean
  is_escalated: boolean
  hold_started_at: string | null
  total_hold_minutes: number
  resolved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  events: TicketEvent[]
  comments: TicketComment[]
  attachments: TicketAttachment[]
}

export interface TicketBrief {
  ticket_id: number
  ticket_number: string
  title: string
  status: TicketStatus
  severity: Severity
  priority: Priority
  environment: Environment
  product: string
  customer_id: string
  assignee_id: string | null
  is_breached: boolean
  is_escalated: boolean
  created_at: string
  updated_at: string
}

export interface CreateTicketRequest {
  title: string
  description: string
  product: string
  environment: Environment
  source?: TicketSource
  area_of_concern?: number
  attachments?: string[]
}

export interface UpdateStatusRequest {
  new_status: TicketStatus
  comment?: string
}

export interface AddCommentRequest {
  body: string
  is_internal: boolean
  triggers_hold: boolean
  triggers_resume: boolean
  ticket_id: number
}

export interface AssignTicketRequest {
  assignee_id: string
}

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

export interface DashboardData {
  summary: DashboardSummary
  distribution: {
    by_status: DistributionItem[]
    by_severity: DistributionItem[]
    by_priority: DistributionItem[]
    by_product: DistributionItem[]
  }
  sla_compliance: SLACompliance
  top_agents: AgentPerformance[]
}

export interface CustomerReport {
  customer_id: string
  total_tickets: number
  open_tickets: number
  resolved_tickets: number
  breached_tickets: number
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

export interface PaginationParams {
  page?: number
  page_size?: number
}

export interface TicketFilterParams extends PaginationParams {
  status?: TicketStatus
  severity?: Severity
  priority?: Priority
  is_breached?: boolean
  is_escalated?: boolean
  customer_id?: string
  assignee_id?: string
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string
  status?: number
}