"use client"

import { useState } from "react"
import { credentialsService } from "../services/credentialsService"
import { ApiError } from "@/lib/apiClient"
import type { CreateCredentialFormValues } from "../schemas/credentialSchema"

/**
 * Hook para crear una credencial.
 * RF-22, RF-23: soporta ssh, git_https y git_ssh.
 */
export function useCreateCredential() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createCredential(
    values: CreateCredentialFormValues,
    onSuccess?: () => void,
  ) {
    setIsPending(true)
    setError(null)
    try {
      await credentialsService.create(values)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError("Configuración de credencial inválida. Revisa los campos.")
        } else if (err.status === 409) {
          setError("Ya existe una credencial con ese nombre.")
        } else {
          setError("Error inesperado. Inténtalo de nuevo.")
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { createCredential, isPending, error }
}
