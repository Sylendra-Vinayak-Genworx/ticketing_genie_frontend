import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ticketService } from '../services/ticketService'
import type { TicketBrief, PaginatedResponse, TicketFilterParams } from '@/types'

// ─── State ────────────────────────────────────────────────────────────────────

interface EscalatedTicketsState {
  list: TicketBrief[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
}

const initialState: EscalatedTicketsState = {
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
  isLoading: false,
  error: null,
}

// ─── Thunk ────────────────────────────────────────────────────────────────────

// Always injects is_escalated: true — this slice is exclusively for escalated tickets
export const fetchEscalatedTickets = createAsyncThunk(
  'escalatedTickets/fetchAll',
  async (params: Omit<TicketFilterParams, 'is_escalated'>, { rejectWithValue }) => {
    try {
      return await ticketService.getAllTickets({ ...params, is_escalated: true })
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load escalated tickets')
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const escalatedTicketsSlice = createSlice({
  name: 'escalatedTickets',
  initialState,
  reducers: {
    setEscalatedPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEscalatedTickets.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        fetchEscalatedTickets.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<TicketBrief>>) => {
          state.isLoading = false
          state.list = action.payload.items
          state.total = action.payload.total
          state.page = action.payload.page
          state.pageSize = action.payload.page_size
        }
      )
      .addCase(fetchEscalatedTickets.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { setEscalatedPage } = escalatedTicketsSlice.actions
export default escalatedTicketsSlice.reducer