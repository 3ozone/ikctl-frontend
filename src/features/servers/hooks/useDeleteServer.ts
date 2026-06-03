"use client"

import { useState } from "react"
import { serversService } from "../services/serversService"
import { ApiError } from "@/lib/apiClient"

/**
 * Hook para eliminar un servidor (RF-33).
 * Maneja 409 cuando el servidor está en uso por algún pipeline o grupo.
 */
export function useDeleteServer() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteServer(serverId: string, onSuccess?: () => void) {
    setIsPending(true)
    setError(null)
    try {
      await serversService.delete(serverId)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(
            "No se puede eliminar: este servidor está en uso por uno o más grupos o pipelines.",
          )
        } else if (err.status === 403) {
          setError("No tienes permisos para eliminar este servidor.")
        } else if (err.status === 404) {
          setError("Servidor no encontrado.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { deleteServer, isPending, error }
}
