import { ticketingApi } from '@/lib/axios'
import type {
  Ticket,
  TicketBrief,
  TicketComment,
  CreateTicketRequest,
  UpdateStatusRequest,
  AddCommentRequest,
  AssignTicketRequest,
  PaginatedResponse,
  TicketFilterParams,
} from '@/types'

export interface AreaOfConcern {
  area_id: number
  name: string
}

export interface AttachmentUploadResponse {
  file_url: string
  file_name: string
  blob_path: string
}

export const ticketService = {
  async createTicket(data: CreateTicketRequest): Promise<Ticket> {
    const res = await ticketingApi.post<Ticket>('/tickets', data)
    return res.data
  },

  async uploadAttachment(file: File): Promise<AttachmentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await ticketingApi.post<AttachmentUploadResponse>(
      '/tickets/attachments/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  async uploadCommentAttachment(file: File): Promise<AttachmentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await ticketingApi.post<AttachmentUploadResponse>(
      '/tickets/comments/attachments/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  async getMyTickets(params: TicketFilterParams): Promise<PaginatedResponse<TicketBrief>> {
    const res = await ticketingApi.get<PaginatedResponse<TicketBrief>>('/tickets/me', { params })
    return res.data
  },

  async getAllTickets(params: TicketFilterParams): Promise<PaginatedResponse<TicketBrief>> {
    const res = await ticketingApi.get<PaginatedResponse<TicketBrief>>('/tickets', { params })
    return res.data
  },

  async getTeamKpis(params: Record<string, string>): Promise<{ active_tickets: number, breached_tickets: number, unclaimed_tickets: number, resolved_tickets: number }> {
    const res = await ticketingApi.get<{ active_tickets: number, breached_tickets: number, unclaimed_tickets: number, resolved_tickets: number }>('/tickets/kpis/team', { params })
    return res.data
  },

  async getTicketById(id: number): Promise<Ticket> {
    const res = await ticketingApi.get<Ticket>(`/tickets/${id}`)
    return res.data
  },

  async updateStatus(id: number, data: UpdateStatusRequest): Promise<TicketBrief> {
    const res = await ticketingApi.put<TicketBrief>(`/tickets/${id}/status`, data)
    return res.data
  },

  async addComment(id: number, data: AddCommentRequest): Promise<any> {
    const res = await ticketingApi.post<TicketComment>(`/tickets/${id}/comments`, data)
    return res.data
  },

  async assignTicket(id: number, data: AssignTicketRequest): Promise<TicketBrief> {
    const res = await ticketingApi.post<TicketBrief>(`/tickets/${id}/assign`, data)
    return res.data
  },

  async getAreasOfConcern(): Promise<AreaOfConcern[]> {
    const res = await ticketingApi.get<AreaOfConcern[]>('/areas-of-concern')
    return res.data
  },

  async selfEscalate(id: number, reason?: string): Promise<TicketBrief> {
    const params = reason ? { reason } : {}
    const res = await ticketingApi.post<TicketBrief>(`/tickets/${id}/escalate`, {}, { params })
    return res.data
  },
}