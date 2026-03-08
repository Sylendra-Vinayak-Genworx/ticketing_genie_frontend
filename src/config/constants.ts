export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  TIME_ONLY: 'h:mm a',
  RELATIVE_THRESHOLD_DAYS: 7,
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  TOKEN_EXPIRY: 'token_expiry',
} as const

export const TICKET_STATUSES = [
  'NEW',
  'ACKNOWLEDGED',
  'OPEN',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
] as const

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
export const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const
export const ENVIRONMENTS = ['PROD', 'STAGE', 'DEV'] as const
export const USER_ROLES = ['user', 'support_agent', 'team_lead', 'admin'] as const
export const MATCH_FIELDS = ['SUBJECT', 'BODY', 'BOTH'] as const

export const ROLE_LABELS: Record<string, string> = {
  user: 'Customer',
  support_agent: 'Support Agent',
  team_lead: 'Team Lead',
  admin: 'Admin',
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-100' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  OPEN: { label: 'Open', color: 'text-sky-700', bg: 'bg-sky-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  ON_HOLD: { label: 'On Hold', color: 'text-gray-700', bg: 'bg-gray-100' },
  RESOLVED: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' },
  CLOSED: { label: 'Closed', color: 'text-slate-700', bg: 'bg-slate-200' },
  REOPENED: { label: 'Reopened', color: 'text-red-700', bg: 'bg-red-100' },
}

export const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  P0: { label: 'P0', color: 'text-red-700', bg: 'bg-red-100' },
  P1: { label: 'P1', color: 'text-orange-700', bg: 'bg-orange-100' },
  P2: { label: 'P2', color: 'text-blue-700', bg: 'bg-blue-100' },
  P3: { label: 'P3', color: 'text-gray-600', bg: 'bg-gray-100' },
}

export const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100' },
  HIGH: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-100' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  LOW: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
}
