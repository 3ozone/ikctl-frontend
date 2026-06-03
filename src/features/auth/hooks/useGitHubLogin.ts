"use client"

import { useState } from "react"
import { authService } from "../services/authService"
import { ApiError } from "@/lib/apiClient"

/**
 * Hook para iniciar el flujo OAuth de GitHub.
 * Obtiene la authorization_url del backend y redirige el navegador a GitHub.
 */
export function useGitHubLogin() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGitHubLogin() {
    setIsPending(true)
    setError(null)
    try {
      const { authorization_url } = await authService.getGitHubAuthUrl()
      globalThis.location.href = authorization_url
    } catch (err) {
      if (err instanceof ApiError) {
        setError("No se pudo iniciar la autenticación con GitHub. Inténtalo de nuevo.")
      } else {
        setError("Error inesperado. Inténtalo de nuevo.")
      }
      setIsPending(false)
    }
    // No reseteamos isPending en éxito — el navegador está redirigiendo
  }

  return { handleGitHubLogin, isPending, error }
}
