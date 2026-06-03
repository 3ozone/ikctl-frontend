"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { useAuthContext } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/apiClient"

function GitHubCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { completeGitHubLogin } = useAuthContext()

  const [status, setStatus] = useState<"loading" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    // Evitar doble ejecución en Strict Mode
    if (hasRun.current) return
    hasRun.current = true

    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      setErrorMessage("Parámetros de autenticación inválidos. Inicia sesión de nuevo.")
      setStatus("error")
      return
    }

    completeGitHubLogin(code, state)
      .then(() => {
        router.replace("/dashboard")
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.status === 401 || err.status === 400) {
            setErrorMessage("El código de GitHub ha expirado o es inválido. Inicia sesión de nuevo.")
          } else {
            setErrorMessage("Error al autenticar con GitHub. Inténtalo de nuevo.")
          }
        } else {
          setErrorMessage("Error inesperado. Inténtalo de nuevo.")
        }
        setStatus("error")
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Autenticando con GitHub...
          </CardTitle>
          <CardDescription
            className="text-center"
            aria-live="polite"
            aria-busy="true"
          >
            Por favor espera mientras completamos el inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
            role="status"
            aria-label="Cargando"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Error de autenticación</CardTitle>
        <CardDescription className="text-center" aria-live="assertive">
          No se pudo completar el inicio de sesión con GitHub.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
        <Link href="/login" className={buttonVariants({ className: "w-full" })}>
          Volver al inicio de sesión
        </Link>
      </CardContent>
    </Card>
  )
}

export default function GitHubCallbackPage() {
  return (
    <Suspense>
      <GitHubCallbackContent />
    </Suspense>
  )
}
