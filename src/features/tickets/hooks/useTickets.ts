import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks'
import {
  fetchMyTickets,
  fetchAllTickets,
  fetchTicketById,
  createTicketThunk,
  updateStatusThunk,
  addCommentThunk,
  assignTicketThunk,
  setFilters,
  setPage,
  clearCurrentTicket,
} from '../slices/ticketsSlice'
import type { TicketFilterParams, CreateTicketRequest, UpdateStatusRequest, AddCommentRequest, AssignTicketRequest } from '@/types'

export function useTickets() {
  const dispatch = useAppDispatch()
  const ticketsState = useAppSelector((s) => s.tickets)

  return {
    ...ticketsState,
    fetchMy: useCallback((p: TicketFilterParams) => dispatch(fetchMyTickets(p)), [dispatch]),
    fetchAll: useCallback((p: TicketFilterParams) => dispatch(fetchAllTickets(p)), [dispatch]),
    fetchById: useCallback((id: number) => dispatch(fetchTicketById(id)), [dispatch]),
    create: useCallback((d: CreateTicketRequest) => dispatch(createTicketThunk(d)), [dispatch]),
    updateStatus: useCallback((id: number, d: UpdateStatusRequest) => dispatch(updateStatusThunk({ id, data: d })), [dispatch]),
    addComment: useCallback((id: number, d: AddCommentRequest) => dispatch(addCommentThunk({ id, data: d })), [dispatch]),
    assign: useCallback((id: number, d: AssignTicketRequest) => dispatch(assignTicketThunk({ id, data: d })), [dispatch]),
    setFilters: useCallback((f: TicketFilterParams) => dispatch(setFilters(f)), [dispatch]),
    setPage: useCallback((p: number) => dispatch(setPage(p)), [dispatch]),
    clearCurrent: useCallback(() => dispatch(clearCurrentTicket()), [dispatch]),
  }
}
