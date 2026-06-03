"use client"

import { useState } from "react"
import { serversService } from "../services/serversService"
import { ApiError } from "@/lib/apiClient"
import type { UpdateServerFormValues } from "../schemas/serverSchema"

/**
 * Hook para actualizar un servidor (RF-32).
 */
export function useUpdateServer() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateServer(
    serverId: string,
    body: UpdateServerFormValues,
    onSuccess?: () => void,
  ) {
    setIsPending(true)
    setError(null)
    try {
      await serversService.update(serverId, body)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Servidor no encontrado.")
        } else if (err.status === 403) {
          setError("No tienes permisos para editar este servidor.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { updateServer, isPending, error }
}
