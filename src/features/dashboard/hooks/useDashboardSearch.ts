import { useState, useCallback, useEffect } from 'react';
import { ticketService } from '@/features/tickets/services/ticketService';
import { useUserResolver } from '@/features/tickets/hooks/useUserResolver';
import type { TicketBrief, TicketStatus, Severity, Priority } from '@/types';

export interface SearchFilters {
  search: string;
  status: TicketStatus | '';
  priority: Priority | '';
  severity: Severity | '';
  product: string;
  date_from: string;
  date_to: string;
}

export const EMPTY_FILTERS: SearchFilters = {
  search: '',
  status: '',
  priority: '',
  severity: '',
  product: '',
  date_from: '',
  date_to: '',
};

const SR_PAGE_SIZE = 15;

export function useDashboardSearch(activeTab: string) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [srTickets, setSrTickets] = useState<TicketBrief[]>([]);
  const [srTotal, setSrTotal] = useState(0);
  const [srPage, setSrPage] = useState(1);
  const [srLoading, setSrLoading] = useState(false);
  const { cache: nameCache, resolve: resolveNames } = useUserResolver();

  const loadSearchTickets = useCallback(async () => {
    setSrLoading(true);
    setSrTickets([]);
    try {
      const params: Record<string, any> = {
        page: srPage,
        page_size: SR_PAGE_SIZE,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.product && { product: filters.product }),
      };
      const res = await ticketService.getAllTickets(params);
      let items = res.items;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(
          (t) => t.ticket_number.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
        );
      }
      setSrTickets(items);
      setSrTotal(res.total);
      const ids = [...new Set(items.map((t) => t.assignee_id).filter((id): id is string => !!id))];
      if (ids.length) resolveNames(ids);
    } catch (e) {
      console.error(e);
    } finally {
      setSrLoading(false);
    }
  }, [srPage, filters]);

  useEffect(() => {
    if (activeTab === 'search') loadSearchTickets();
  }, [activeTab, loadSearchTickets]);

  const hasFilters = Object.values(filters).some(Boolean);

  return {
    filters,
    setFilters,
    srTickets,
    srTotal,
    srPage,
    setSrPage,
    srLoading,
    nameCache,
    hasFilters,
    SR_PAGE_SIZE,
  };
}
