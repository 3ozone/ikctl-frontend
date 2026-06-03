import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "Iniciar sesión | ikctl",
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
        <CardDescription className="text-center">
          Accede a tu panel de control de servidores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
