import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ticketService } from '../services/ticketService'
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

// ─── State ────────────────────────────────────────────────────────────────────

interface TicketsState {
  list: TicketBrief[]
  currentTicket: Ticket | null
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  isLoadingDetail: boolean
  isSubmitting: boolean
  error: string | null
  filters: TicketFilterParams
}

const initialState: TicketsState = {
  list: [],
  currentTicket: null,
  total: 0,
  page: 1,
  pageSize: 20,
  isLoading: false,
  isLoadingDetail: false,
  isSubmitting: false,
  error: null,
  filters: {},
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMyTickets = createAsyncThunk(
  'tickets/fetchMy',
  async (params: TicketFilterParams, { rejectWithValue }) => {
    try {
      return await ticketService.getMyTickets(params)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load tickets')
    }
  }
)

export const fetchAllTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (params: TicketFilterParams, { rejectWithValue }) => {
    try {
      return await ticketService.getAllTickets(params)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load tickets')
    }
  }
)

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await ticketService.getTicketById(id)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Ticket not found')
    }
  }
)

export const createTicketThunk = createAsyncThunk(
  'tickets/create',
  async (data: CreateTicketRequest, { rejectWithValue }) => {
    try {
      return await ticketService.createTicket(data)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create ticket')
    }
  }
)

export const updateStatusThunk = createAsyncThunk(
  'tickets/updateStatus',
  async ({ id, data }: { id: number; data: UpdateStatusRequest }, { rejectWithValue }) => {
    try {
      return await ticketService.updateStatus(id, data)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update status')
    }
  }
)

export const addCommentThunk = createAsyncThunk(
  'tickets/addComment',
  async ({ id, data }: { id: number; data: AddCommentRequest }, { rejectWithValue }) => {
    try {
      return await ticketService.addComment(id, data)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to add comment')
    }
  }
)

export const assignTicketThunk = createAsyncThunk(
  'tickets/assign',
  async ({ id, data }: { id: number; data: AssignTicketRequest }, { rejectWithValue }) => {
    try {
      return await ticketService.assignTicket(id, data)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to assign ticket')
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<TicketFilterParams>) {
      state.filters = action.payload
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    clearCurrentTicket(state) {
      state.currentTicket = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const loadingList = (state: TicketsState) => { state.isLoading = true; state.error = null }
    const failedList = (state: TicketsState, action: any) => {
      state.isLoading = false
      state.error = action.payload
    }
    const fulfilledList = (state: TicketsState, action: PayloadAction<PaginatedResponse<TicketBrief>>) => {
      state.isLoading = false
      state.list = action.payload.items
      state.total = action.payload.total
      state.page = action.payload.page
      state.pageSize = action.payload.page_size
    }

    builder
      .addCase(fetchMyTickets.pending, loadingList)
      .addCase(fetchMyTickets.fulfilled, fulfilledList)
      .addCase(fetchMyTickets.rejected, failedList)
      .addCase(fetchAllTickets.pending, loadingList)
      .addCase(fetchAllTickets.fulfilled, fulfilledList)
      .addCase(fetchAllTickets.rejected, failedList)

    builder
      .addCase(fetchTicketById.pending, (state) => { state.isLoadingDetail = true })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.isLoadingDetail = false
        state.currentTicket = action.payload
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.isLoadingDetail = false
        state.error = action.payload as string
      })

    builder
      .addCase(createTicketThunk.pending, (state) => { state.isSubmitting = true })
      .addCase(createTicketThunk.fulfilled, (state) => { state.isSubmitting = false })
      .addCase(createTicketThunk.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })

    builder
      .addCase(addCommentThunk.pending, (state) => { state.isSubmitting = true })
      .addCase(addCommentThunk.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.currentTicket = action.payload
      })
      .addCase(addCommentThunk.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })

    builder
      .addCase(updateStatusThunk.pending, (state) => { state.isSubmitting = true })
      .addCase(updateStatusThunk.fulfilled, (state) => { state.isSubmitting = false })
      .addCase(updateStatusThunk.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })

    builder
      .addCase(assignTicketThunk.pending, (state) => { state.isSubmitting = true })
      .addCase(assignTicketThunk.fulfilled, (state) => { state.isSubmitting = false })
      .addCase(assignTicketThunk.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })
  },
})

export const { setFilters, setPage, clearCurrentTicket, clearError } = ticketsSlice.actions
export default ticketsSlice.reducer
