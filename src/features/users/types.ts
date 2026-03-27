import type { UserRole } from '@/types';

// ─── User/Team Types ──────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  lead_id: string | null;
  members: TeamMember[];
}

export interface TeamListResponse {
  total: number;
  teams: Team[];
}

export interface TeamCreateRequest {
  name: string;
  description?: string;
  lead_id: string;
  member_ids: string[];
}

export interface AddMemberRequest {
  user_id: string;
}

export interface AgentSkill {
  area_id: number;
  area_name: string;
  proficiency_level: string;
}

export interface AgentSkillUpdateRequest {
  skills: {
    area_id: number;
    proficiency_level: string;
  }[];
}

export interface AgentSkillListResponse {
  skills: AgentSkill[];
}

// ─── UsersPage Types ──────────────────────────────────────────────────────────

export type TabView = 'admin' | 'team_lead' | 'support_agent' | 'customers';
export type ModalMode = 'view' | 'edit' | 'create' | 'skills' | null;

export interface SkillForm {
  area_id: number;
  proficiency_level: string;
}
