"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { twoFactorSchema, type TwoFactorFormValues } from "../schemas/registerSchema"
import { authService } from "../services/authService"
import { useAuthContext } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/apiClient"
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

interface TwoFactorFormProps {
  /** temp_token recibido de la respuesta de login */
  tempToken: string
}

export function TwoFactorForm({ tempToken }: TwoFactorFormProps) {
  const { silentRefresh } = useAuthContext()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  })

  async function handleSubmit(values: TwoFactorFormValues) {
    setIsPending(true)
    try {
      await authService.loginWith2FA(tempToken, values.code)
      // El backend establece la cookie de refresh — hacemos silent refresh para obtener el access_token
      await silentRefresh()
      router.push("/dashboard")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          form.setError("code", { message: "Código incorrecto o expirado" })
        } else {
          form.setError("root", {
            message: "Error inesperado. Inténtalo de nuevo.",
          })
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
        className="space-y-4"
      >
        {form.formState.errors.root && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {form.formState.errors.root.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de verificación</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="123456"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="text-center text-2xl tracking-widest"
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
          {isPending ? "Verificando..." : "Verificar"}
        </Button>
      </form>
    </Form>
  )
}
