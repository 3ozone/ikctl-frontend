"use client"

import { useAuthContext } from "@/contexts/AuthContext"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { TwoFactorForm } from "@/features/auth/components/TwoFactorForm"
import Link from "next/link"

/**
 * Página de verificación 2FA.
 * El temp_token viene del AuthContext (memoria) — nunca de la URL.
 */
export default function TwoFactorPage() {
  const { tempToken } = useAuthContext()

  if (!tempToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Sesión inválida</CardTitle>
          <CardDescription className="text-center">
            Vuelve a{" "}
            <Link href="/login" className="underline">
              iniciar sesión
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          Verificación en dos pasos
        </CardTitle>
        <CardDescription className="text-center">
          Introduce el código de 6 dígitos de tu aplicación de autenticación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TwoFactorForm tempToken={tempToken} />
      </CardContent>
    </Card>
  )
}

