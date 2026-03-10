"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "../services/authService"
import { ApiError } from "@/lib/apiClient"
import type { UseFormSetError } from "react-hook-form"
import type { ResetPasswordFormValues } from "../schemas/resetPasswordSchema"

interface UseResetPasswordOptions {
  token: string | null
  setError: UseFormSetError<ResetPasswordFormValues>
}

/**
 * Hook que encapsula la lógica de restablecimiento de contraseña.
 * Lee el token de la URL (pasado como prop desde la página) y llama al backend.
 * Redirige a /login tras éxito.
 */
export function useResetPassword({ token, setError }: UseResetPasswordOptions) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleResetPassword(values: ResetPasswordFormValues) {
    if (!token) {
      setError("root", { message: "El enlace de recuperación no es válido." })
      return
    }

    setIsPending(true)
    try {
      await authService.resetPassword(token, values.new_password)
      router.push("/login?reset=success")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 404) {
          setError("root", {
            message: "El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.",
          })
        } else {
          setError("root", { message: "Error inesperado. Inténtalo de nuevo." })
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { handleResetPassword, isPending }
}
