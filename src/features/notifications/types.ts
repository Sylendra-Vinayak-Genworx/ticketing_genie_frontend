export type NotificationEventType =
  | 'TICKET_CREATED'
  | 'STATUS_CHANGED'
  | 'AGENT_COMMENT'
  | 'CUSTOMER_COMMENT'
  | 'TICKET_ASSIGNED'
  | 'SLA_BREACHED'
  | 'AUTO_CLOSED'

export interface SSENotification {
  type: NotificationEventType
  ticket_id?: number
  ticket_number?: string
  title?: string
  message: string
  timestamp: string
  // STATUS_CHANGED extras
  old_status?: string
  new_status?: string
  // CUSTOMER_COMMENT extras
  customer_name?: string
  // SLA_BREACHED extras
  severity?: string
  breach_type?: string
}

export interface NotificationItem extends SSENotification {
  id: string       // client-generated uid
  read: boolean
}