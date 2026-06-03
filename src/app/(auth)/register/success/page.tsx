import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Cuenta creada | ikctl",
}

export default function RegisterSuccessPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">¡Cuenta creada!</CardTitle>
        <CardDescription className="text-center">
          Revisa tu email y haz clic en el enlace de verificación para activar
          tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">
          ¿No has recibido el email? Revisa la carpeta de spam o{" "}
          {/* TODO: Implementar botón de reenvío */}
          solicita un nuevo enlace.
        </p>
      </CardContent>
    </Card>
  )
}
