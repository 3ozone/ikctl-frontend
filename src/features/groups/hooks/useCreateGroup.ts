"use client"

import { useState } from "react"
import { groupsService } from "../services/groupsService"
import type { GroupFormValues } from "../schemas/groupSchema"

export function useCreateGroup() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createGroup(body: GroupFormValues, onSuccess?: () => void) {
    setIsPending(true)
    setError(null)
    try {
      await groupsService.create(body)
      onSuccess?.()
    } catch {
      setError("No se pudo crear el grupo. Inténtalo de nuevo.")
    } finally {
      setIsPending(false)
    }
  }

  return { createGroup, isPending, error }
}
