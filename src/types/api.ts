/**
 * Tipos de respuesta del backend ikctl API.
 * Corresponden exactamente al contrato definido en openapi.yaml.
 */

// ─── Auth Responses ────────────────────────────────────────────────────────

export interface RegisterResponse {
  user_id: string
  message: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: "Bearer"
  expires_in: number
  requires_2fa: boolean
  temp_token?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: "Bearer"
  expires_in: number
}

export interface TwoFactorLoginResponse {
  access_token: string
  refresh_token: string
  token_type: "Bearer"
  expires_in: number
}

// ─── User Responses ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  email: string
  is_verified: boolean
  is_2fa_enabled: boolean
  created_at: string
}

// ─── 2FA Responses ─────────────────────────────────────────────────────────

export interface Enable2FAResponse {
  secret: string
  qr_code_uri: string
  provisioning_uri: string
}

// ─── Error Responses ───────────────────────────────────────────────────────

export interface ApiErrorBody {
  detail: string | ApiValidationError[]
}

export interface ApiValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

// ─── Generic ───────────────────────────────────────────────────────────────

export interface MessageResponse {
  message: string
}

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

// ─── Credentials ───────────────────────────────────────────────────────────

export interface CredentialResponse {
  credential_id: string
  user_id: string
  name: string
  credential_type: "ssh" | "git_https" | "git_ssh"
  username: string | null
  created_at: string
  updated_at: string
}

export type CredentialListResponse = PaginatedResponse<CredentialResponse>

// ─── Server Responses ─────────────────────────────────────────────────────────

export interface ServerResponse {
  id: string
  user_id: string
  name: string
  type: "remote" | "local"
  host: string | null
  port: number | null
  credential_id: string | null
  description: string | null
  status: "active" | "inactive"
  os_id: string | null
  os_version: string | null
  os_name: string | null
  created_at: string
  updated_at: string
}

export type ServerListResponse = PaginatedResponse<ServerResponse>

export interface HealthCheckResponse {
  status: "online" | "offline"
  latency_ms: number | null
  os_id: string | null
  os_version: string | null
  os_name: string | null
}

export interface AdHocCommandResponse {
  stdout: string
  stderr: string
  exit_code: number
}

// ─── Group Responses ──────────────────────────────────────────────────────────

export interface GroupResponse {
  id: string
  user_id: string
  name: string
  description: string | null
  server_ids: string[]
  created_at: string
  updated_at: string
}

export type GroupListResponse = PaginatedResponse<GroupResponse>
