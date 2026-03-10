"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  enable2FAVerifySchema,
  disable2FASchema,
  type Enable2FAVerifyFormValues,
  type Disable2FAFormValues,
} from "../schemas/profileSchemas"
import { useEnable2FA, useDisable2FA } from "../hooks/useEnable2FA"
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

interface TwoFASettingsProps {
  is2FAEnabled: boolean
  onChanged: () => void
}

export function TwoFASettings({ is2FAEnabled, onChanged }: TwoFASettingsProps) {
  if (is2FAEnabled) {
    return <Disable2FASection onDeactivated={onChanged} />
  }
  return <Enable2FASection onActivated={onChanged} />
}

// ─── Activar 2FA ──────────────────────────────────────────────────────────────

function Enable2FASection({ onActivated }: { onActivated: () => void }) {
  const { step, setup, isPending, errorMessage, startEnable, confirmEnable, cancel } =
    useEnable2FA(onActivated)

  const form = useForm<Enable2FAVerifyFormValues>({
    resolver: zodResolver(enable2FAVerifySchema),
    defaultValues: { code: "" },
  })

  if (step === "idle") {
    return (
      <Button onClick={startEnable} disabled={isPending} aria-busy={isPending}>
        {isPending ? "Iniciando..." : "Activar verificación en dos pasos"}
      </Button>
    )
  }

  if (step === "success") {
    return (
      <p role="status" aria-live="polite" className="text-sm text-green-600">
        2FA activado correctamente. Tu cuenta está más segura.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {setup && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Escanea el código QR con tu aplicación de autenticación (Google
            Authenticator, Authy, etc.) o introduce la clave manualmente:
          </p>
          <p className="rounded bg-muted px-3 py-2 font-mono text-sm break-all">
            {setup.secret}
          </p>
          {setup.qr_code_uri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={setup.qr_code_uri}
              alt="Código QR para configurar 2FA"
              className="mx-auto h-40 w-40"
            />
          )}
        </div>
      )}

      {errorMessage && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => confirmEnable(values.code))}
          noValidate
          className="space-y-4"
        >
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
                    className="text-center tracking-widest"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? "Verificando..." : "Confirmar activación"}
            </Button>
            <Button type="button" variant="outline" onClick={cancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

// ─── Desactivar 2FA ───────────────────────────────────────────────────────────

function Disable2FASection({ onDeactivated }: { onDeactivated: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const { handleDisable, isPending, errorMessage } = useDisable2FA(onDeactivated)

  const form = useForm<Disable2FAFormValues>({
    resolver: zodResolver(disable2FASchema),
    defaultValues: { code: "" },
  })

  if (!showForm) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-green-600">
          La verificación en dos pasos está activa. ✓
        </p>
        <Button variant="outline" onClick={() => setShowForm(true)}>
          Desactivar 2FA
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Introduce el código de tu aplicación de autenticación para confirmar la
        desactivación.
      </p>

      {errorMessage && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => handleDisable(values.code))}
          noValidate
          className="space-y-4"
        >
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
                    className="text-center tracking-widest"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? "Desactivando..." : "Confirmar desactivación"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
