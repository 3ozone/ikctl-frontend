"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { adHocCommandSchema, type AdHocCommandFormValues } from "../schemas/serverSchema"
import { useAdHocCommand } from "../hooks/useAdHocCommand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AdHocCommandPanelProps {
  serverId: string
}

export function AdHocCommandPanel({ serverId }: AdHocCommandPanelProps) {
  const { execCommand, commandResult, isPending, error } = useAdHocCommand()

  const form = useForm<AdHocCommandFormValues>({
    resolver: zodResolver(adHocCommandSchema) as Resolver<AdHocCommandFormValues>,
    defaultValues: { command: "", sudo: false, timeout: 30 },
  })

  function handleSubmit(values: AdHocCommandFormValues) {
    execCommand(serverId, values)
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <h3 className="text-sm font-medium">Ejecutar comando</h3>

      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-3">
        <div>
          <Label htmlFor="adhoc-command">Comando</Label>
          <Input
            id="adhoc-command"
            placeholder="ej: ls -la /var/log"
            {...form.register("command")}
            aria-describedby={form.formState.errors.command ? "adhoc-command-error" : undefined}
          />
          {form.formState.errors.command && (
            <p id="adhoc-command-error" className="mt-1 text-xs text-destructive">
              {form.formState.errors.command.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="adhoc-sudo"
            type="checkbox"
            {...form.register("sudo")}
            aria-label="sudo"
          />
          <Label htmlFor="adhoc-sudo">sudo</Label>
        </div>

        <Button type="submit" size="sm" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Ejecutando…" : "Ejecutar"}
        </Button>
      </form>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {commandResult && (
        <section aria-label="Salida del comando" className="space-y-2">
          {commandResult.stdout && (
            <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {commandResult.stdout}
            </pre>
          )}
          {commandResult.stderr && (
            <pre className="rounded-md bg-destructive/10 p-3 text-xs font-mono text-destructive overflow-x-auto whitespace-pre-wrap">
              {commandResult.stderr}
            </pre>
          )}
          <p className="text-xs text-muted-foreground">
            Exit code: {commandResult.exit_code}
          </p>
        </section>
      )}
    </div>
  )
}
