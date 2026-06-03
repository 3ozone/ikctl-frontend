"use client"

import { useServerHealth } from "../hooks/useServerHealth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ServerHealthCardProps {
  serverId: string
}

export function ServerHealthCard({ serverId }: ServerHealthCardProps) {
  const { checkHealth, health, isPending, error } = useServerHealth()

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Estado del servidor</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => checkHealth(serverId)}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Comprobando…" : "Comprobar"}
        </Button>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {health && (
        <dl className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Estado:</dt>
            <dd>
              <Badge variant={health.status === "online" ? "default" : "outline"}>
                {health.status}
              </Badge>
            </dd>
          </div>
          {health.latency_ms != null && (
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Latencia:</dt>
              <dd>{health.latency_ms} ms</dd>
            </div>
          )}
          {health.os_name && (
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Sistema:</dt>
              <dd>{health.os_name}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
