// ─── Users Feature Constants ──────────────────────────────────────────────────

export const STAFF_ROLES = ['admin', 'team_lead', 'support_agent'];

export const ROLE_OPTIONS = [
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'support_agent', label: 'Support Agent' },
];

export const PROFICIENCY_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', color: 'bg-gray-100 text-gray-700' },
  { value: 'INTERMEDIATE', label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
  { value: 'ADVANCED', label: 'Advanced', color: 'bg-green-100 text-green-700' },
  { value: 'EXPERT', label: 'Expert', color: 'bg-purple-100 text-purple-700' },
];

const TIER_PALETTE: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  2: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  4: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const DEFAULT_TIER_STYLE = { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
const NULL_TIER_STYLE = { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' };

export function tierStyle(tierId: number | null) {
  if (!tierId) return NULL_TIER_STYLE;
  return TIER_PALETTE[tierId] ?? DEFAULT_TIER_STYLE;
}
