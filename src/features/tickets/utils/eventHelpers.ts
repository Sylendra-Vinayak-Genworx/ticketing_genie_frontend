import type { TicketEvent } from '@/types';

// UUID pattern — used to detect when new_value/old_value is a user ID
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(value: string | null): boolean {
  return !!value && UUID_RE.test(value);
}

/** Resolve a value: if it looks like a UUID, look it up in userNames; otherwise format as status label */
export function resolveValue(value: string | null, userNames: Record<string, string>): string {
  if (!value) return '';
  if (isUUID(value)) {
    return userNames[value] || value.slice(0, 8) + '…';
  }
  // Status/field value — replace underscores with spaces
  return value.replace(/_/g, ' ');
}

export function deduplicateEvents(events: TicketEvent[]): TicketEvent[] {
  if (events.length < 2) return events;
  const result: TicketEvent[] = [];
  let i = 0;
  while (i < events.length) {
    const ev = events[i];
    const next = events[i + 1];
    if (
      ev.event_type === 'STATUS_CHANGED' &&
      ev.new_value === 'NEW' &&
      next?.event_type === 'STATUS_CHANGED' &&
      next.old_value === 'NEW' &&
      next.new_value === 'ACKNOWLEDGED' &&
      !next.triggered_by_user_id
    ) {
      result.push({
        ...ev,
        event_type: 'CREATED' as TicketEvent['event_type'],
        old_value: null,
        new_value: 'ACKNOWLEDGED',
        ...({ reason: 'Ticket created and acknowledged' } as unknown as Partial<TicketEvent>),
      } as TicketEvent);
      i += 2;
      continue;
    }
    result.push(ev);
    i++;
  }
  return result;
}
