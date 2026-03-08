import { ticketingApi } from '@/lib/axios'
import type {
  Ticket,
  TicketBrief,
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

export const ticketService = {
  async createTicket(data: CreateTicketRequest): Promise<Ticket> {
    const res = await ticketingApi.post<Ticket>('/tickets', data)
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
    const res = await ticketingApi.post<Ticket>(`/tickets/${id}/comments`, data)
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