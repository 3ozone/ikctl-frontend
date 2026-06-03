"use client"

import { useState } from "react"
import { groupsService } from "../services/groupsService"
import { ApiError } from "@/lib/apiClient"

export function useDeleteGroup() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteGroup(groupId: string, onSuccess?: () => void) {
    setIsPending(true)
    setError(null)
    try {
      await groupsService.delete(groupId)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(
          "No se puede eliminar: este grupo está vinculado a uno o más pipelines.",
        )
      } else {
        setError("No se pudo eliminar el grupo. Inténtalo de nuevo.")
      }
    } finally {
      setIsPending(false)
    }
  }

  return { deleteGroup, isPending, error }
}
