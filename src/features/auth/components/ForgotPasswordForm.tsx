"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/forgotPasswordSchema"
import { useForgotPassword } from "../hooks/useForgotPassword"
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

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const { handleForgotPassword, isPending, isSuccess } = useForgotPassword({
    setError: form.setError,
  })

  if (isSuccess) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-center text-sm text-muted-foreground"
      >
        Si el email está registrado, recibirás un enlace para restablecer tu
        contraseña en breve. Revisa también la carpeta de spam.
      </p>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleForgotPassword)}
        noValidate
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
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

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </Form>
  )
}
