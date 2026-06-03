"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "../schemas/profileSchemas"
import { useChangePassword } from "../hooks/useChangePassword"
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

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  const { handleChangePassword, isPending, isSuccess } = useChangePassword({
    setError: form.setError,
    onSuccess: () => form.reset(),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleChangePassword)}
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

        {isSuccess && (
          <p role="status" aria-live="polite" className="text-sm text-green-600">
            Contraseña actualizada correctamente.
          </p>
        )}

        <FormField
          control={form.control}
          name="current_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña actual</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nueva contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Guardando..." : "Cambiar contraseña"}
        </Button>
      </form>
    </Form>
  )
}
