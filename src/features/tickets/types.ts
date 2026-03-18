import type {
  TicketStatus, Severity, Priority, Environment, TicketSource,
  QueueType, RoutingStatus, EventType, UserRole, PaginationParams,
} from '@/types'

// ─── Ticket Types ─────────────────────────────────────────────────────────────

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
  response_due_at: string
  resolution_due_at: string
  is_breached: boolean
  resolved_at?: string | null
  is_escalated: boolean
  escalation_level: number
  hold_started_at: string | null
  total_hold_minutes: number
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
  resolution_sla_completed_at?: string | null
  product: string
  customer_id: string
  assignee_id: string | null
  is_breached: boolean
  is_escalated: boolean
  created_at: string
  updated_at: string
  resolution_due_at: string
  resolved_at: string
  escalation_level: number
  team_id?: string
  queue_type?: string
  routing_status?: string
  response_due_at?: string
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

export interface TicketFilterParams extends PaginationParams {
  status?: TicketStatus
  severity?: Severity
  priority?: Priority
  is_breached?: boolean
  is_escalated?: boolean
  is_unassigned?: boolean
  customer_id?: string
  assignee_id?: string
  team_id?: string
  queue_type?: string
  routing_status?: string
}
