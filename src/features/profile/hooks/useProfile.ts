"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { profileService } from "../services/profileService"
import type { UserProfile } from "@/types/api"

/**
 * Hook que obtiene y actualiza el perfil del usuario autenticado.
 * Usa el accessToken del AuthContext — nunca lo almacena por separado.
 */
export function useProfile() {
  const { accessToken } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await profileService.getProfile(accessToken)
      setProfile(data)
    } catch {
      setError("No se pudo cargar el perfil. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback(
    async (name: string) => {
      if (!accessToken) return
      setIsSaving(true)
      setSaveSuccess(false)
      try {
        const updated = await profileService.updateProfile(accessToken, name)
        setProfile(updated)
        setSaveSuccess(true)
      } finally {
        setIsSaving(false)
      }
    },
    [accessToken],
  )

  return { profile, isLoading, error, isSaving, saveSuccess, updateProfile, fetchProfile }
}
