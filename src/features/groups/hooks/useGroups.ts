"use client"

import { useCallback, useEffect, useState } from "react"
import { groupsService } from "../services/groupsService"
import type { GroupListResponse } from "@/types/api"

export function useGroups(page = 1, perPage = 10) {
  const [data, setData] = useState<GroupListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await groupsService.list(page, perPage)
      setData(result)
    } catch {
      setError("No se pudieron cargar los grupos. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return {
    groups: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch: fetchGroups,
  }
}
