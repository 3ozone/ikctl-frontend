import { apiClient } from "@/lib/apiClient"
import type {
  CredentialResponse,
  CredentialListResponse,
} from "@/types/api"
import type {
  CreateCredentialFormValues,
  UpdateCredentialFormValues,
} from "@/features/credentials/schemas/credentialSchema"

/** RF-21 a RF-26: Operaciones CRUD sobre credenciales del usuario autenticado. */
export const credentialsService = {
  /** RF-21: Listar credenciales paginadas */
  list: (page = 1, perPage = 20) =>
    apiClient.get<CredentialListResponse>(
      `/credentials?page=${page}&per_page=${perPage}`,
    ),

  /** RF-21: Obtener una credencial por id */
  get: (credentialId: string) =>
    apiClient.get<CredentialResponse>(`/credentials/${credentialId}`),

  /** RF-22, RF-23: Crear credencial */
  create: (body: CreateCredentialFormValues) =>
    apiClient.post<CredentialResponse>("/credentials", body),

  /** RF-24: Actualizar credencial */
  update: (credentialId: string, body: UpdateCredentialFormValues) =>
    apiClient.put<CredentialResponse>(`/credentials/${credentialId}`, body),

  /** RF-25: Eliminar credencial */
  delete: (credentialId: string) =>
    apiClient.delete<void>(`/credentials/${credentialId}`),
}
