"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/apiClient"
import type { UseFormSetError } from "react-hook-form"
import type { LoginFormValues } from "../schemas/loginSchema"

interface UseLoginOptions {
  setError: UseFormSetError<LoginFormValues>
}

/**
 * Hook que encapsula la lógica de login.
 * Maneja: autenticación básica, flujo 2FA, rate limiting y errores de API.
 */
export function useLogin({ setError }: UseLoginOptions) {
  const { login } = useAuthContext()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleLogin(values: LoginFormValues) {
    setIsPending(true)
    try {
      const response = await login(values.email, values.password)

      if (response.requires_2fa) {
        // temp_token ya guardado en AuthContext — navegar sin pasar token por URL
        router.push("/login/2fa")
        return
      }

      router.push("/dashboard")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("root", {
            message: "Email o contraseña incorrectos",
          })
        } else if (err.status === 429) {
          setError("root", {
            message:
              "Demasiados intentos. Tu cuenta está bloqueada 15 minutos.",
          })
        } else if (err.status === 403) {
          setError("root", {
            message:
              "Email no verificado. Revisa tu bandeja de entrada.",
          })
        } else {
          setError("root", { message: "Error inesperado. Inténtalo de nuevo." })
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { handleLogin, isPending }
}
