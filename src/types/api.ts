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
