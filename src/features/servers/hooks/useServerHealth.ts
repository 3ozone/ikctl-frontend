"use client"

import { useState } from "react"
import { serversService } from "../services/serversService"
import { ApiError } from "@/lib/apiClient"
import type { HealthCheckResponse } from "@/types/api"

export function useServerHealth() {
  const [isPending, setIsPending] = useState(false)
  const [health, setHealth] = useState<HealthCheckResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkHealth(serverId: string) {
    setIsPending(true)
    setError(null)
    setHealth(null)
    try {
      const result = await serversService.health(serverId)
      setHealth(result)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Servidor no encontrado.")
        } else if (err.status === 403) {
          setError("No tienes permisos para comprobar este servidor.")
        } else {
          setError("Error al comprobar el servidor. Inténtalo de nuevo.")
        }
      } else {
        setError("Error de conexión. Inténtalo de nuevo.")
      }
    } finally {
      setIsPending(false)
    }
  }

  return { checkHealth, health, isPending, error }
}
