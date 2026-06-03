"use client"

import { useState } from "react"
import { groupsService } from "../services/groupsService"
import type { UpdateGroupFormValues } from "../schemas/groupSchema"

export function useUpdateGroup() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateGroup(groupId: string, body: UpdateGroupFormValues, onSuccess?: () => void) {
    setIsPending(true)
    setError(null)
    try {
      await groupsService.update(groupId, body)
      onSuccess?.()
    } catch {
      setError("No se pudo actualizar el grupo. Inténtalo de nuevo.")
    } finally {
      setIsPending(false)
    }
  }

  return { updateGroup, isPending, error }
}
