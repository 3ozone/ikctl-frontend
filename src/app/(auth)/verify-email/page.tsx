"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useVerifyEmail } from "@/features/auth/hooks/useVerifyEmail"
import {
  resendVerificationSchema,
  type ResendVerificationFormValues,
} from "@/features/auth/schemas/verifyEmailSchema"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const { status, errorMessage, isResending, resendSuccess, resendVerification } =
    useVerifyEmail({ token })

  const form = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  })

  if (status === "loading" || status === "idle") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Verificando tu email...
          </CardTitle>
          <CardDescription className="text-center" aria-live="polite" aria-busy="true">
            Un momento, estamos validando tu cuenta.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === "success") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">¡Email verificado!</CardTitle>
          <CardDescription className="text-center">
            Tu cuenta está activa. Ya puedes iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Iniciar sesión
          </Link>
        </CardContent>
      </Card>
    )
  }

  // status === "error"
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Enlace no válido</CardTitle>
        <CardDescription className="text-center" aria-live="polite">
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resendSuccess ? (
          <p
            role="status"
            aria-live="polite"
            className="text-center text-sm text-muted-foreground"
          >
            Si el email está registrado, recibirás un nuevo enlace en breve.
          </p>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                resendVerification(values.email),
              )}
              noValidate
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isResending}>
                {isResending ? "Enviando..." : "Reenviar enlace de verificación"}
              </Button>
            </form>
          </Form>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
