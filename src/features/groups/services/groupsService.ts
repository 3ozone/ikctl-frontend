import { apiClient } from "@/lib/apiClient"
import type { GroupResponse, GroupListResponse } from "@/types/api"
import type { GroupFormValues, UpdateGroupFormValues } from "@/features/groups/schemas/groupSchema"

/** RF-39 a RF-43: Operaciones sobre grupos del usuario autenticado. */
export const groupsService = {
  /** RF-39: Listar grupos paginados */
  list: (page = 1, perPage = 10) =>
    apiClient.get<GroupListResponse>(`/groups?page=${page}&per_page=${perPage}`),

  /** Obtener detalle de un grupo */
  get: (groupId: string) =>
    apiClient.get<GroupResponse>(`/groups/${groupId}`),

  /** RF-40: Crear grupo */
  create: (body: GroupFormValues) =>
    apiClient.post<GroupResponse>("/groups", body),

  /** RF-41: Actualizar grupo */
  update: (groupId: string, body: UpdateGroupFormValues) =>
    apiClient.put<GroupResponse>(`/groups/${groupId}`, body),

  /** RF-42: Eliminar grupo */
  delete: (groupId: string) =>
    apiClient.delete<void>(`/groups/${groupId}`),
}
