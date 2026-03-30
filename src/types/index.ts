
export type UserRole = 'user' | 'support_agent' | 'team_lead' | 'admin'

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

// ─── Pagination (shared utility types) ────────────────────────────────────────

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

export interface ApiError {
  detail: string
  status?: number
}

// ─── Re-exports for backward compatibility ────────────────────────────────────
// Existing code using `from '@/types'` continues to work without changes.

export type {
  User, AuthTokens, LoginRequest, SignupRequest,
  UserUpdateRequest, UserCreateRequest, UserCreateResponse, AuthState,
} from '@/features/auth/types'

export type {
  TeamMember, Team, TeamListResponse, TeamCreateRequest, AddMemberRequest,
  AgentSkill, AgentSkillUpdateRequest, AgentSkillListResponse,
  TabView, ModalMode, SkillForm,
} from '@/features/users/types'

export type {
  TicketEvent, TicketComment, TicketAttachment, Ticket, TicketBrief,
  CreateTicketRequest, UpdateStatusRequest, AddCommentRequest,
  AssignTicketRequest, TicketFilterParams,
} from '@/features/tickets/types'

export type {
  SLARule, SLA, CreateSLARequest, CreateSLARuleRequest, UpdateSLARuleRequest,
} from '@/features/sla/types'

export type {
  KeywordRule, CreateKeywordRuleRequest, UpdateKeywordRuleRequest,
} from '@/features/keywords/types'

export type {
  DashboardSummary, DistributionItem, SLACompliance,
  AgentPerformance, DashboardData, CustomerReport, TeamComparison,
} from '@/features/analytics/types'

export type {
  Product, ProductCreateRequest, ProductUpdateRequest,
} from '@/features/product/types'