"use client"

import { useState } from "react"
import { credentialsService } from "../services/credentialsService"
import { ApiError } from "@/lib/apiClient"

/**
 * Hook para eliminar una credencial (RF-25).
 * Maneja 409 cuando la credencial está en uso por algún servidor.
 */
export function useDeleteCredential() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteCredential(
    credentialId: string,
    onSuccess?: () => void,
  ) {
    setIsPending(true)
    setError(null)
    try {
      await credentialsService.delete(credentialId)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(
            "No se puede eliminar: esta credencial está siendo usada por uno o más servidores.",
          )
        } else if (err.status === 403) {
          setError("No tienes permisos para eliminar esta credencial.")
        } else if (err.status === 404) {
          setError("Credencial no encontrada.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { deleteCredential, isPending, error }
}
