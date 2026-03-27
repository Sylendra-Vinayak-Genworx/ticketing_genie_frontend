import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { ticketService } from '../services/ticketService';
import { userService } from '@/features/users/services/userService';
import type { TicketBrief, TicketStatus, Severity, Priority, User } from '@/types';

export interface TeamTicketFilters {
  status: TicketStatus | '';
  severity: Severity | '';
  priority: Priority | '';
  search: string;
  quickFilter: 'all' | 'unassigned' | 'escalated';
  assigneeId: string;
}

const PAGE_SIZE = 20;

export function useTeamTickets() {
  const { user } = useAuth();
  const teamId = (user as unknown as { team_id?: string })?.team_id;
  const leadId = user?.id;

  const [tickets, setTickets] = useState<TicketBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [nameCache, setNameCache] = useState<Record<string, string>>({});
  const [teamAgents, setTeamAgents] = useState<User[]>([]);
  const [filters, setFilters] = useState<TeamTicketFilters>({
    status: '',
    severity: '',
    priority: '',
    search: '',
    quickFilter: 'all',
    assigneeId: '',
  });

  // Load agents belonging to this team lead once on mount
  useEffect(() => {
    if (!leadId) return;
    userService
      .getAgentsByLead(leadId)
      .then((agents) => {
        setTeamAgents(agents);
        // Pre-populate the name cache with team agents
        const entries: Record<string, string> = {};
        agents.forEach((a) => {
          entries[a.id] = a.full_name || a.email;
        });
        setNameCache((prev) => ({ ...prev, ...entries }));
      })
      .catch((err) => console.error('Failed to load team agents', err));
  }, [leadId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setTickets([]);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: PAGE_SIZE,
        ...(teamId && { team_id: teamId }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assigneeId && { assignee_id: filters.assigneeId }),
      };

      if (filters.quickFilter === 'unassigned') {
        // Unclaimed = ACKNOWLEDGED tickets with no assignee.
        // OPEN tickets always have an assignee (assignment triggers ACKNOWLEDGED→OPEN).
        // Using status=ACKNOWLEDGED + is_unassigned=true gives the precise set.
        params.is_unassigned = true;
        params.status = 'ACKNOWLEDGED';
      } else if (filters.quickFilter === 'escalated') {
        params.is_escalated = true;
      } else {
        // No quickFilter — apply user-selected status filter if any
        if (filters.status) params.status = filters.status;
      }

      const res = await ticketService.getAllTickets(params);
      setTickets(res.items);
      setTotal(res.total);

      // Resolve assignee display names
      const unknownIds = [
        ...new Set(res.items.map((t) => t.assignee_id).filter((id): id is string => !!id)),
      ];
      if (unknownIds.length > 0) {
        setNameCache((prev) => {
          const missing = unknownIds.filter((id) => !prev[id]);
          if (missing.length === 0) return prev;
          missing.forEach((id) => {
            userService
              .getUserById(id)
              .then((u) => setNameCache((c) => ({ ...c, [id]: u.full_name || u.email })))
              .catch(() => setNameCache((c) => ({ ...c, [id]: id.slice(0, 8) + '…' })));
          });
          return prev;
        });
      }
    } catch (err) {
      console.error('useTeamTickets load error', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    filters.status,
    filters.severity,
    filters.priority,
    filters.quickFilter,
    filters.assigneeId,
    teamId,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side search filter
  const displayed = filters.search
    ? tickets.filter(
        (t) =>
          t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          t.ticket_number.toLowerCase().includes(filters.search.toLowerCase())
      )
    : tickets;

  return {
    tickets: displayed,
    total,
    page,
    setPage,
    isLoading,
    nameCache,
    teamAgents,
    filters,
    setFilters,
    refetch: load,
  };
}
