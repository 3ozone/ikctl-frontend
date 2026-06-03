"use client"

import { useCallback, useState } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { authService } from "@/features/auth/services/authService"
import { ApiError } from "@/lib/apiClient"
import type { Enable2FAResponse } from "@/types/api"

type Enable2FAStep = "idle" | "show-qr" | "verifying" | "success" | "error"

/**
 * Hook que gestiona el flujo completo de activación de 2FA:
 * 1. Solicitar QR y secret al backend
 * 2. Mostrar QR al usuario para que lo escanee
 * 3. Verificar código para confirmar activación
 */
export function useEnable2FA(onActivated?: () => void) {
  const { accessToken } = useAuthContext()
  const [step, setStep] = useState<Enable2FAStep>("idle")
  const [setup, setSetup] = useState<Enable2FAResponse | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const startEnable = useCallback(async () => {
    if (!accessToken) return
    setIsPending(true)
    setErrorMessage(null)
    try {
      const data = await authService.enable2FA(accessToken)
      setSetup(data)
      setStep("show-qr")
    } catch {
      setStep("error")
      setErrorMessage("No se pudo iniciar la activación de 2FA. Inténtalo de nuevo.")
    } finally {
      setIsPending(false)
    }
  }, [accessToken])

  const confirmEnable = useCallback(
    async (code: string) => {
      if (!accessToken) return
      setIsPending(true)
      setStep("verifying")
      setErrorMessage(null)
      try {
        await authService.verify2FA(accessToken, code)
        setStep("success")
        onActivated?.()
      } catch (err) {
        setStep("show-qr")
        if (err instanceof ApiError && err.status === 401) {
          setErrorMessage("Código incorrecto o expirado. Inténtalo de nuevo.")
        } else {
          setErrorMessage("Error al verificar el código. Inténtalo de nuevo.")
        }
      } finally {
        setIsPending(false)
      }
    },
    [accessToken, onActivated],
  )

  const cancel = useCallback(() => {
    setStep("idle")
    setSetup(null)
    setErrorMessage(null)
  }, [])

  return { step, setup, isPending, errorMessage, startEnable, confirmEnable, cancel }
}

/**
 * Hook que gestiona la desactivación de 2FA.
 */
export function useDisable2FA(onDeactivated?: () => void) {
  const { accessToken } = useAuthContext()
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDisable = useCallback(
    async (code: string) => {
      if (!accessToken) return
      setIsPending(true)
      setErrorMessage(null)
      try {
        await authService.disable2FA(accessToken, code)
        onDeactivated?.()
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setErrorMessage("Código incorrecto o expirado.")
        } else {
          setErrorMessage("Error al desactivar 2FA. Inténtalo de nuevo.")
        }
      } finally {
        setIsPending(false)
      }
    },
    [accessToken, onDeactivated],
  )

  return { handleDisable, isPending, errorMessage }
}
