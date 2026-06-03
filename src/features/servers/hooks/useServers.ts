"use client"

import { useCallback, useEffect, useState } from "react"
import { serversService } from "../services/serversService"
import type { ServerListResponse } from "@/types/api"

/**
 * Hook que carga la lista paginada de servidores del usuario (RF-27).
 */
export function useServers(page = 1, perPage = 10) {
  const [data, setData] = useState<ServerListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await serversService.list(page, perPage)
      setData(result)
    } catch {
      setError("No se pudieron cargar los servidores. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  return {
    servers: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch: fetchServers,
  }
}
