export { ticketService } from './services/ticketService'
export { useTickets } from './hooks/useTickets'
export {
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
} from './slices/ticketsSlice'
export { default as ticketsReducer } from './slices/ticketsSlice'
