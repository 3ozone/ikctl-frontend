"use client"

import Link from "next/link"
import { useServer } from "@/features/servers/hooks/useServer"
import { ServerHealthCard } from "@/features/servers/components/ServerHealthCard"
import { AdHocCommandPanel } from "@/features/servers/components/AdHocCommandPanel"
import { Badge } from "@/components/ui/badge"

interface ServerDetailPageProps {
  params: { id: string }
}

export default function ServerDetailPage({ params }: ServerDetailPageProps) {
  const { server, isLoading, error } = useServer(params.id)

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center" aria-busy="true" aria-live="polite">
        Cargando servidor…
      </p>
    )
  }

  if (error || !server) {
    return (
      <div className="space-y-4">
        <Link href="/servers" className="text-sm text-muted-foreground hover:underline">
          ← Volver a servidores
        </Link>
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error ?? "Servidor no encontrado."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/servers" className="text-sm text-muted-foreground hover:underline">
          ← Volver
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{server.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{server.type}</Badge>
          <Badge variant={server.status === "active" ? "default" : "outline"}>
            {server.status}
          </Badge>
          {server.host && <span>{server.host}</span>}
        </div>
        {server.description && (
          <p className="text-sm text-muted-foreground">{server.description}</p>
        )}
      </div>

      <ServerHealthCard serverId={params.id} />

      <AdHocCommandPanel serverId={params.id} />
    </div>
  )
}
