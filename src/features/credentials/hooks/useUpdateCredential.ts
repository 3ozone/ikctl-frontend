"use client"

import { useState } from "react"
import { credentialsService } from "../services/credentialsService"
import { ApiError } from "@/lib/apiClient"
import type { UpdateCredentialFormValues } from "../schemas/credentialSchema"

/**
 * Hook para actualizar una credencial existente (RF-24).
 */
export function useUpdateCredential() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateCredential(
    credentialId: string,
    values: UpdateCredentialFormValues,
    onSuccess?: () => void,
  ) {
    setIsPending(true)
    setError(null)
    try {
      await credentialsService.update(credentialId, values)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Credencial no encontrada.")
        } else if (err.status === 403) {
          setError("No tienes permisos para editar esta credencial.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { updateCredential, isPending, error }
}
