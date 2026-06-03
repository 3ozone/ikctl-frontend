"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "../services/authService"
import { ApiError } from "@/lib/apiClient"
import type { UseFormSetError } from "react-hook-form"
import type { RegisterFormValues } from "../schemas/registerSchema"

interface UseRegisterOptions {
  setError: UseFormSetError<RegisterFormValues>
}

/**
 * Hook que encapsula la lógica de registro.
 * Maneja: creación de cuenta, email duplicado y errores de API.
 */
export function useRegister({ setError }: UseRegisterOptions) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleRegister(values: RegisterFormValues) {
    setIsPending(true)
    try {
      await authService.register(values.name, values.email, values.password)
      setIsSuccess(true)
      router.push("/register/success")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("email", {
            message: "Este email ya está registrado",
          })
        } else if (err.status === 422) {
          // Intentar mapear errores de validación del servidor al campo correcto
          const detail = err.body.detail
          if (Array.isArray(detail)) {
            for (const fieldErr of detail) {
              const field = fieldErr.loc[fieldErr.loc.length - 1]
              if (field === "email" || field === "name" || field === "password") {
                setError(field as keyof RegisterFormValues, {
                  message: fieldErr.msg,
                })
              }
            }
          } else {
            setError("root", { message: err.message })
          }
        } else {
          setError("root", { message: "Error inesperado. Inténtalo de nuevo." })
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { handleRegister, isPending, isSuccess }
}
