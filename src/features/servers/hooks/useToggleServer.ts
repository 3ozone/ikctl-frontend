"use client"

import { useState } from "react"
import { serversService } from "../services/serversService"
import { ApiError } from "@/lib/apiClient"

/**
 * Hook para habilitar/deshabilitar un servidor (RF-34).
 */
export function useToggleServer() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggleServer(serverId: string, onSuccess?: () => void) {
    setIsPending(true)
    setError(null)
    try {
      await serversService.toggle(serverId)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Servidor no encontrado.")
        } else if (err.status === 403) {
          setError("No tienes permisos para modificar este servidor.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { toggleServer, isPending, error }
}
