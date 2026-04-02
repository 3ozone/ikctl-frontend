"use client"

import { useState } from "react"
import { serversService } from "../services/serversService"
import { ApiError } from "@/lib/apiClient"
import type { RegisterServerFormValues, RegisterLocalServerFormValues } from "../schemas/serverSchema"

type CreateServerBody =
  | (RegisterServerFormValues & { type: "remote" })
  | (RegisterLocalServerFormValues & { type: "local" })

/**
 * Hook para crear un servidor remoto o local (RF-28, RF-29, RF-30).
 */
export function useCreateServer() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createServer(body: CreateServerBody, onSuccess?: () => void) {
    setIsPending(true)
    setError(null)
    try {
      await serversService.create(body)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(
            body.type === "local"
              ? "Ya existe un servidor local. Solo puedes tener uno."
              : "Ya existe un servidor con ese nombre.",
          )
        } else if (err.status === 400) {
          setError("Datos inválidos. Revisa los campos.")
        } else if (err.status === 403) {
          setError("No tienes permisos para crear servidores.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { createServer, isPending, error }
}
