import { useState, useEffect, useCallback } from 'react'
import { teamService } from '@/features/users/services/teamService'
import { ticketService } from '../services/ticketService'
import type { Team, TicketBrief } from '@/types'

export interface TeamStat {
  team: Team
  total: number
  open: number
  inProgress: number
  resolved: number
  breached: number
  escalated: number
  unassigned: number
  resolutionRate: number  // % resolved out of total
  breachRate: number      // % breached out of total
}

const BACKEND_PAGE_SIZE = 100 // backend enforces le=100

/** Normalise any ID value to a lowercase string for safe map keying.
 *  Handles both plain strings and UUID objects serialised by Pydantic. */
function normalise(id: unknown): string {
  return String(id ?? '').toLowerCase().trim()
}

/** Fetch every page until all tickets are collected. */
async function fetchAllTickets(): Promise<TicketBrief[]> {
  const collected: TicketBrief[] = []
  let currentPage = 1
  while (true) {
    const res = await ticketService.getAllTickets({
      page: currentPage,
      page_size: BACKEND_PAGE_SIZE,
    })
    collected.push(...(res.items as TicketBrief[]))
    const totalPages = Math.ceil(res.total / BACKEND_PAGE_SIZE)
    if (currentPage >= totalPages || res.items.length === 0) break
    currentPage++
  }
  return collected
}

export function useTeamPerformance() {
  const [teams, setTeams]         = useState<Team[]>([])
  const [stats, setStats]         = useState<TeamStat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [teamsRes, allTickets] = await Promise.all([
        teamService.listTeams(),
        fetchAllTickets(),
      ])

      const allTeams = teamsRes.teams

      // ── Build assignee-id → team-id lookup ────────────────────────────────
      //
      // WHY: ticket.team_id is set only by the auto-assignment Celery task and
      //      is NULL for all manually assigned / self-claimed tickets.
      //      ticket.assignee_id is always set once someone handles the ticket,
      //      so it is the reliable key to resolve team ownership.
      //
      // HOW: listTeams() already returns each team with its members list
      //      (agents whose User.lead_id == team.lead_id).  We also explicitly
      //      add the lead themselves because get_agents_by_lead() only returns
      //      agents — the lead's own lead_id is NULL so they are never in
      //      team.members.
      //
      // NORMALISE: both team.lead_id and member.id come from Pydantic UUID
      //      fields serialised to JSON strings.  ticket.assignee_id is stored
      //      as str(uuid) in the ticketing DB.  All three should already be
      //      lowercase-hyphenated UUIDs, but we normalise to be safe and
      //      eliminate any casing / whitespace differences.
      //
      // KEY  : normalised assignee_id  (string)
      // VALUE: team.id as returned by the API (used as-is for comparisons)
      const assigneeToTeamId = new Map<string, string>()

      allTeams.forEach(team => {
        // 1. The lead themselves — NOT present in team.members
        if (team.lead_id) {
          assigneeToTeamId.set(normalise(team.lead_id), team.id)
        }
        // 2. Every agent who belongs to this team
        team.members?.forEach(member => {
          assigneeToTeamId.set(normalise(member.id), team.id)
        })
      })

      // ── Bucket each ticket into a team ────────────────────────────────────
      // Priority:
      //   1. assignee_id lookup  (covers virtually all real tickets)
      //   2. ticket.team_id      (fallback for auto-assigned tickets)
      //   3. skip                (ticket has no assignee and no team_id yet)
      const byTeam = new Map<string, TicketBrief[]>()
      allTeams.forEach(t => byTeam.set(t.id, []))

      allTickets.forEach(ticket => {
        let resolvedTeamId: string | undefined

        if (ticket.assignee_id) {
          resolvedTeamId = assigneeToTeamId.get(normalise(ticket.assignee_id))
        }

        if (!resolvedTeamId && ticket.team_id) {
          // team_id from the ticket is already a plain string — normalise too
          const normTid = normalise(ticket.team_id)
          // find the matching team by normalised id
          const matched = allTeams.find(t => normalise(t.id) === normTid)
          if (matched) resolvedTeamId = matched.id
        }

        if (resolvedTeamId && byTeam.has(resolvedTeamId)) {
          byTeam.get(resolvedTeamId)!.push(ticket)
        }
      })

      // ── Per-team metrics ──────────────────────────────────────────────────
      const computed: TeamStat[] = allTeams.map(team => {
        const tickets    = byTeam.get(team.id) ?? []
        const total      = tickets.length
        const open       = tickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'NEW'].includes(t.status)).length
        const inProgress = tickets.filter(t => ['IN_PROGRESS', 'ON_HOLD'].includes(t.status)).length
        const resolved   = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length
        const breached   = tickets.filter(t => t.is_breached).length
        const escalated  = tickets.filter(t => t.is_escalated).length
        const unassigned = tickets.filter(t => !t.assignee_id).length

        return {
          team,
          total,
          open,
          inProgress,
          resolved,
          breached,
          escalated,
          unassigned,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
          breachRate:     total > 0 ? Math.round((breached / total) * 100) : 0,
        }
      })

      computed.sort((a, b) => b.total - a.total)

      setTeams(allTeams)
      setStats(computed)
    } catch (err) {
      console.error('useTeamPerformance error', err)
      setError('Failed to load team performance data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { teams, stats, isLoading, error, reload: load }
}