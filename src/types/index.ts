export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  auth_type: "ssh_key" | "password";
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ServerHealth {
  status: "healthy" | "unhealthy" | "unreachable";
  latency_ms?: number;
  message?: string;
  checked_at: string;
}

export interface Operation {
  id: string;
  server_id: string;
  server_name?: string;
  kit: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  output?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateServerPayload {
  name: string;
  host: string;
  port: number;
  user: string;
  auth_type: "ssh_key" | "password";
  password?: string;
  ssh_key?: string;
  description?: string;
}

export interface CreateOperationPayload {
  server_id: string;
  kit: string;
  sudo?: boolean;
  variables?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
