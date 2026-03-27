import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SLATimerProps {
  // Detail view: pass one specific SLA's due date + slaType
  dueAt?: string | null;
  // List/compact view: pass both due dates, component picks most urgent
  responseDueAt?: string | null;
  resolutionDueAt?: string | null;

  createdAt?: string;
  status: string;
  isBreached?: boolean;
  label?: string;
  slaType?: 'response' | 'resolution';
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  // The definitive backend timestamp for when resolution SLA was completed
  resolutionSlaCompletedAt?: string | null;
  updatedAt?: string | null;
  compact?: boolean;
}

function pickUrgentDue(a?: string | null, b?: string | null): string | null {
  if (!a && !b) return null;
  if (!a) return b!;
  if (!b) return a;
  return new Date(a) <= new Date(b) ? a : b;
}

export function SLATimer({
  dueAt,
  responseDueAt,
  resolutionDueAt,
  createdAt,
  status,
  isBreached = false,
  label,
  slaType,
  firstResponseAt,
  resolvedAt,
  resolutionSlaCompletedAt,
  updatedAt,
  compact = false,
}: SLATimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  // ── Effective due date ────────────────────────────────────────────────────
  const effectiveDueAt: string | null =
    responseDueAt !== undefined || resolutionDueAt !== undefined
      ? pickUrgentDue(responseDueAt, resolutionDueAt)
      : (dueAt ?? null);

  const due: Date | null = effectiveDueAt ? new Date(effectiveDueAt) : null;
  const dueValid = due !== null && !isNaN(due.getTime());

  // ── Completion timestamp ──────────────────────────────────────────────────
  // Priority order:
  //   1. Explicit response/resolution timestamps from backend
  //   2. Terminal states (CLOSED, RESOLVED) as fallbacks
  const completionTime: Date | null = (() => {
    // If ticket is CLOSED, everything is considered done.
    if (status === 'CLOSED') {
      const ts = resolutionSlaCompletedAt || resolvedAt || firstResponseAt || updatedAt;
      if (ts) return new Date(ts);
      return new Date(); // Final fallback to now to stop ticker
    }

    if (slaType === 'response') {
      if (firstResponseAt) return new Date(firstResponseAt);
      // If it moves past OPEN, it has been responded to.
      if (!['NEW', 'ACKNOWLEDGED', 'OPEN'].includes(status)) {
        const ts = updatedAt || null;
        return ts ? new Date(ts) : new Date();
      }
      return null;
    }

    if (slaType === 'resolution') {
      const ts = resolutionSlaCompletedAt || resolvedAt;
      if (ts) return new Date(ts);
      if (status === 'RESOLVED') {
        const fallbackTs = updatedAt || null;
        return fallbackTs ? new Date(fallbackTs) : new Date();
      }
      return null;
    }

    // Compact/list mode — no slaType.
    if (status === 'RESOLVED') {
      const ts = resolutionSlaCompletedAt || resolvedAt || updatedAt;
      if (ts) return new Date(ts);
      return new Date();
    }

    return null;
  })();

  const isCompleted = completionTime !== null && !isNaN(completionTime.getTime());
  const wasMetOnTime = isCompleted && dueValid && completionTime! <= due!;

  // ── Countdown ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!dueValid || isCompleted) return;

    const tick = () => {
      const now = new Date();
      const diff = due!.getTime() - now.getTime();
      const abs = Math.abs(diff);

      const days = Math.floor(abs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 365) {
        setTimeLeft('Not Started');
        return;
      }

      if (diff <= 0) {
        setTimeLeft(
          days > 0 ? `${days}d ${hours}h ${minutes}m overdue` : `${hours}h ${minutes}m overdue`
        );
      } else {
        setTimeLeft(
          days > 0 ? `${days}d ${hours}h ${minutes}m remaining` : `${hours}h ${minutes}m remaining`
        );
      }
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [effectiveDueAt, isCompleted, dueValid]);

  // ── Not Started ───────────────────────────────────────────────────────────
  if (!dueValid && !isCompleted) {
    if (compact)
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 border border-gray-200">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Not Started</span>
        </div>
      );
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NOT STARTED</p>
          <p className="text-xs text-gray-400">SLA tracking pending</p>
        </div>
      </div>
    );
  }

  // ── Completed ─────────────────────────────────────────────────────────────
  if (isCompleted) {
    // Backend is_breached is tiebreaker — accounts for hold/pause durations
    const breached = isBreached || !wasMetOnTime;

    if (breached) {
      if (compact)
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">
              BREACHED
            </span>
          </div>
        );
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              {label ? label.replace('Met', 'Breached') : 'SLA BREACHED'}
            </p>
            <div className="w-full bg-red-200 rounded-full h-1.5 mt-1">
              <div className="bg-red-600 h-1.5 rounded-full w-full" />
            </div>
          </div>
        </div>
      );
    }

    if (compact)
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide whitespace-nowrap">
            MET
          </span>
        </div>
      );
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            {label || 'SLA MET'}
          </p>
          <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
            <div className="bg-green-600 h-1.5 rounded-full w-full" />
          </div>
        </div>
        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      </div>
    );
  }

  // ── Active: breached ──────────────────────────────────────────────────────
  if (isBreached) {
    if (compact)
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-600 font-medium whitespace-nowrap">{timeLeft}</span>
        </div>
      );
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">SLA BREACHED</p>
          <p className="text-xs text-red-600 font-medium">{timeLeft}</p>
        </div>
      </div>
    );
  }

  // ── Active: healthy countdown ─────────────────────────────────────────────
  if (compact)
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 border border-blue-200">
        <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        <span className="text-xs text-blue-600 font-medium whitespace-nowrap">{timeLeft}</span>
      </div>
    );
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">SLA ACTIVE</p>
        <p className="text-xs text-blue-600 font-medium">{timeLeft}</p>
      </div>
    </div>
  );
}
