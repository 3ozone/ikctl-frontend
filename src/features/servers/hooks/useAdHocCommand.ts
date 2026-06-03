"use client"

import { useState } from "react"
import { serversService } from "../services/serversService"
import { ApiError } from "@/lib/apiClient"
import type { AdHocCommandResponse } from "@/types/api"
import type { AdHocCommandFormValues } from "../schemas/serverSchema"

export function useAdHocCommand() {
  const [isPending, setIsPending] = useState(false)
  const [commandResult, setCommandResult] = useState<AdHocCommandResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function execCommand(serverId: string, body: AdHocCommandFormValues) {
    setIsPending(true)
    setError(null)
    setCommandResult(null)
    try {
      const result = await serversService.exec(serverId, body)
      setCommandResult(result)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Servidor no encontrado.")
        } else if (err.status === 403) {
          setError("No tienes permisos para ejecutar comandos en este servidor.")
        } else if (err.status === 422) {
          setError("Error al ejecutar el comando. Revisa los parámetros.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      } else {
        setError("Error de conexión. Inténtalo de nuevo.")
      }
    } finally {
      setIsPending(false)
    }
  }

  return { execCommand, commandResult, isPending, error }
}
