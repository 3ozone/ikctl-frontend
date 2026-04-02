"use client"

import { useCallback, useEffect, useState } from "react"
import { credentialsService } from "../services/credentialsService"
import type { CredentialResponse, CredentialListResponse } from "@/types/api"

/**
 * Hook que carga la lista paginada de credenciales del usuario.
 * Expone `refetch` para recargar tras mutaciones.
 */
export function useCredentials(page = 1, perPage = 20) {
  const [data, setData] = useState<CredentialListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCredentials = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await credentialsService.list(page, perPage)
      setData(result)
    } catch {
      setError("No se pudieron cargar las credenciales. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage])

  useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  return {
    credentials: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch: fetchCredentials,
  }
}

/**
 * Hook para obtener el detalle de una credencial.
 */
export function useCredential(credentialId: string) {
  const [credential, setCredential] = useState<CredentialResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    credentialsService
      .get(credentialId)
      .then((data) => { if (!cancelled) setCredential(data) })
      .catch(() => { if (!cancelled) setError("No se encontró la credencial.") })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [credentialId])

  return { credential, isLoading, error }
}
