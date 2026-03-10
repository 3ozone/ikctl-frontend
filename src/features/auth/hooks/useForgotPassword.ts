"use client"

import { useState } from "react"
import { authService } from "../services/authService"
import type { UseFormSetError } from "react-hook-form"
import type { ForgotPasswordFormValues } from "../schemas/forgotPasswordSchema"

interface UseForgotPasswordOptions {
  setError: UseFormSetError<ForgotPasswordFormValues>
}

/**
 * Hook que encapsula la lógica de "¿Olvidaste tu contraseña?".
 * Siempre muestra mensaje de éxito tras enviar — no revela si el email existe.
 */
export function useForgotPassword({ setError }: UseForgotPasswordOptions) {
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleForgotPassword(values: ForgotPasswordFormValues) {
    setIsPending(true)
    try {
      await authService.forgotPassword(values.email)
    } catch {
      // Silenciar cualquier error — nunca revelar si el email existe o no
    } finally {
      // Siempre mostrar éxito independientemente del resultado
      setIsSuccess(true)
      setIsPending(false)
    }
  }

  return { handleForgotPassword, isPending, isSuccess }
}
