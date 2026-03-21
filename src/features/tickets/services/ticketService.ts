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

  /**
   * Upload a single file to GCS via the backend.
   * Returns the public file_url to include in the ticket's attachments list.
   */
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

  /**
   * Upload a single file to GCS via the backend for use in a comment.
   * Returns the blob_path to include in the comment's attachments list.
   */
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
}