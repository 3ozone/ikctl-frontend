import { apiClient } from "@/lib/apiClient"
import type {
  ServerResponse,
  ServerListResponse,
  HealthCheckResponse,
  AdHocCommandResponse,
} from "@/types/api"
import type {
  RegisterServerFormValues,
  RegisterLocalServerFormValues,
  UpdateServerFormValues,
  AdHocCommandFormValues,
} from "@/features/servers/schemas/serverSchema"

type CreateServerBody =
  | (RegisterServerFormValues & { type: "remote" })
  | (RegisterLocalServerFormValues & { type: "local" })

/** RF-27 a RF-37: Operaciones sobre servidores del usuario autenticado. */
export const serversService = {
  /** RF-27: Listar servidores paginados */
  list: (page = 1, perPage = 10) =>
    apiClient.get<ServerListResponse>(`/servers?page=${page}&per_page=${perPage}`),

  /** RF-31: Obtener detalle de un servidor */
  get: (serverId: string) =>
    apiClient.get<ServerResponse>(`/servers/${serverId}`),

  /** RF-28, RF-29: Crear servidor (remoto o local) */
  create: (body: CreateServerBody) =>
    apiClient.post<ServerResponse>("/servers", body),

  /** RF-32: Actualizar servidor */
  update: (serverId: string, body: UpdateServerFormValues) =>
    apiClient.put<ServerResponse>(`/servers/${serverId}`, body),

  /** RF-33: Eliminar servidor */
  delete: (serverId: string) =>
    apiClient.delete<void>(`/servers/${serverId}`),

  /** RF-34: Habilitar/deshabilitar servidor */
  toggle: (serverId: string) =>
    apiClient.patch<ServerResponse>(`/servers/${serverId}/toggle`),

  /** RF-35: Health check */
  health: (serverId: string) =>
    apiClient.get<HealthCheckResponse>(`/servers/${serverId}/health`),

  /** RF-36: Ejecutar comando ad-hoc */
  exec: (serverId: string, body: AdHocCommandFormValues) =>
    apiClient.post<AdHocCommandResponse>(`/servers/${serverId}/exec`, body),
}
