import type { UserRole } from '@/types';

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  lead_id: string | null;
  customer_tier_id: number | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  full_name?: string;
  is_active?: boolean;
  customer_tier_id?: number | null;
  preferred_mode_of_contact?: 'email' | 'sms';
}

export interface UserCreateRequest {
  email: string;
  full_name: string;
  role: UserRole;
}

export interface UserCreateResponse {
  user: User;
  temporary_password: string;
}

export interface AuthState {
  user: User | null;
  access_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
