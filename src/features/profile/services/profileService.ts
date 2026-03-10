import { apiClient } from "@/lib/apiClient"
import type { UserProfile, MessageResponse } from "@/types/api"

/**
 * Servicio de perfil de usuario.
 * Todas las llamadas requieren el accessToken en el header Authorization.
 */
export const profileService = {
  /** RF-18: Obtener datos del usuario autenticado */
  getProfile: (accessToken: string) =>
    apiClient.get<UserProfile>("/auth/users/me", {
      Authorization: `Bearer ${accessToken}`,
    }),

  /** RF-18: Actualizar nombre del usuario */
  updateProfile: (accessToken: string, name: string) =>
    apiClient.put<UserProfile>(
      "/auth/users/me",
      { name },
      { Authorization: `Bearer ${accessToken}` },
    ),
}
