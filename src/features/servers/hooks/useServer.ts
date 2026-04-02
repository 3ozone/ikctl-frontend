"use client"

import { useState, useEffect } from "react"
import { serversService } from "../services/serversService"
import { ApiError } from "@/lib/apiClient"
import type { ServerResponse } from "@/types/api"

export function useServer(serverId: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [server, setServer] = useState<ServerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await serversService.get(serverId)
        if (!cancelled) setServer(data)
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            if (err.status === 404) {
              setError("Servidor no encontrado.")
            } else if (err.status === 403) {
              setError("No tienes permisos para ver este servidor.")
            } else {
              setError("Error inesperado. Inténtalo de nuevo.")
            }
          } else {
            setError("Error de conexión. Inténtalo de nuevo.")
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [serverId])

  return { server, isLoading, error }
}
