"use client"

import { useState } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { authService } from "@/features/auth/services/authService"
import { ApiError } from "@/lib/apiClient"
import type { UseFormSetError } from "react-hook-form"
import type { ChangePasswordFormValues } from "../schemas/profileSchemas"

interface UseChangePasswordOptions {
  setError: UseFormSetError<ChangePasswordFormValues>
  onSuccess?: () => void
}

export function useChangePassword({ setError, onSuccess }: UseChangePasswordOptions) {
  const { accessToken } = useAuthContext()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleChangePassword(values: ChangePasswordFormValues) {
    if (!accessToken) return
    setIsPending(true)
    setIsSuccess(false)
    try {
      await authService.changePassword(
        accessToken,
        values.current_password,
        values.new_password,
      )
      setIsSuccess(true)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("current_password", {
            message: "La contraseña actual es incorrecta",
          })
        } else if (err.status === 422) {
          setError("new_password", { message: err.message })
        } else {
          setError("root", { message: "Error inesperado. Inténtalo de nuevo." })
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return { handleChangePassword, isPending, isSuccess }
}
