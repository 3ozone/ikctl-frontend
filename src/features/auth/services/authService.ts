import { apiClient } from "@/lib/apiClient"
import type {
  RegisterResponse,
  LoginResponse,
  TwoFactorLoginResponse,
  Enable2FAResponse,
  MessageResponse,
  AuthTokens,
} from "@/types/api"

/**
 * Servicio de autenticación.
 * Todas las llamadas van via apiClient — nunca fetch directo.
 */
export const authService = {
  /** RF-01: Registro de usuario */
  register: (name: string, email: string, password: string) =>
    apiClient.post<RegisterResponse>("/auth/register", { name, email, password }),

  /** RF-05: Reenvío de email de verificación */
  resendVerification: (email: string) =>
    apiClient.post<MessageResponse>("/auth/resend-verification", { email }),

  /** RF-02: Verificar email con token */
  verifyEmail: (token: string) =>
    apiClient.post<MessageResponse>("/auth/verify-email", { token }),

  /** RF-06: Login con email y contraseña */
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/auth/login", { email, password }),

  /** RF-11: Login con código TOTP (paso 2FA) */
  loginWith2FA: (tempToken: string, code: string) =>
    apiClient.post<TwoFactorLoginResponse>("/auth/login/2fa", {
      temp_token: tempToken,
      code,
    }),

  /** GitHub OAuth — obtener URL de autorización */
  getGitHubAuthUrl: () =>
    apiClient.get<{ authorization_url: string }>("/auth/login/github"),

  /** RF-14: Refresh silencioso usando cookie HttpOnly */
  refresh: () => apiClient.post<AuthTokens>("/auth/refresh", {}),

  /** RF-17: Logout — revoca refresh_token en el servidor */
  logout: () => apiClient.post<MessageResponse>("/auth/logout", {}),

  /** RF-10: Solicitar reset de contraseña */
  forgotPassword: (email: string) =>
    apiClient.post<MessageResponse>("/auth/password/forgot", { email }),

  /** RF-18: Restablecer contraseña con token */
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<MessageResponse>("/auth/password/reset", {
      token,
      new_password: newPassword,
    }),

  /** RF-19: Cambiar contraseña (requiere token en header) */
  changePassword: (
    accessToken: string,
    currentPassword: string,
    newPassword: string,
  ) =>
    apiClient.put<MessageResponse>(
      "/auth/users/me/password",
      { current_password: currentPassword, new_password: newPassword },
      { Authorization: `Bearer ${accessToken}` },
    ),

  /** RF-20: Iniciar activación de 2FA */
  enable2FA: (accessToken: string) =>
    apiClient.post<Enable2FAResponse>(
      "/auth/users/me/2fa/enable",
      {},
      { Authorization: `Bearer ${accessToken}` },
    ),

  /** RF-20: Verificar código para confirmar activación de 2FA */
  verify2FA: (accessToken: string, code: string) =>
    apiClient.post<MessageResponse>(
      "/auth/users/me/2fa/verify",
      { code },
      { Authorization: `Bearer ${accessToken}` },
    ),

  /** RF-20: Desactivar 2FA */
  disable2FA: (accessToken: string, code: string) =>
    apiClient.post<MessageResponse>(
      "/auth/users/me/2fa/disable",
      { code },
      { Authorization: `Bearer ${accessToken}` },
    ),
}
