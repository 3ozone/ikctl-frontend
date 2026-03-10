"use client"

import { useCallback, useEffect, useState } from "react"
import { authService } from "../services/authService"
import { ApiError } from "@/lib/apiClient"

type VerifyStatus = "idle" | "loading" | "success" | "error"

interface UseVerifyEmailOptions {
  token: string | null
}

/**
 * Hook que verifica el email con el token recibido por URL.
 * - Ejecuta la verificación automáticamente al montar si hay token.
 * - Expone estado y función de reenvío para cuando el token es inválido.
 */
export function useVerifyEmail({ token }: UseVerifyEmailOptions) {
  const [status, setStatus] = useState<VerifyStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const verify = useCallback(async () => {
    if (!token) {
      setStatus("error")
      setErrorMessage("El enlace de verificación no es válido.")
      return
    }

    setStatus("loading")
    try {
      await authService.verifyEmail(token)
      setStatus("success")
    } catch (err) {
      setStatus("error")
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 404) {
          setErrorMessage("El enlace ha expirado o ya fue utilizado.")
        } else {
          setErrorMessage("Error al verificar el email. Inténtalo de nuevo.")
        }
      } else {
        setErrorMessage("Error inesperado. Inténtalo de nuevo.")
      }
    }
  }, [token])

  useEffect(() => {
    verify()
  }, [verify])

  const resendVerification = useCallback(async (email: string) => {
    setIsResending(true)
    setResendSuccess(false)
    try {
      await authService.resendVerification(email)
      setResendSuccess(true)
    } catch {
      // Siempre mostrar mensaje de éxito para no revelar si el email existe
      setResendSuccess(true)
    } finally {
      setIsResending(false)
    }
  }, [])

  return { status, errorMessage, isResending, resendSuccess, resendVerification }
}
