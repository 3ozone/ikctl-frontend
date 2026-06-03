"use client"

import { useServers } from "../hooks/useServers"
import { useDeleteServer } from "../hooks/useDeleteServer"
import { useToggleServer } from "../hooks/useToggleServer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ServerResponse } from "@/types/api"

// ─── Paginación ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
}

function Pagination({ page, total, perPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-end gap-2 pt-2" aria-label="Paginación">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
      >
        Siguiente
      </Button>
    </div>
  )
}

// ─── Fila de servidor ─────────────────────────────────────────────────────────

interface ServerRowProps {
  server: ServerResponse
  onEdit: (server: ServerResponse) => void
  onDelete: (serverId: string) => void
  onToggle: (serverId: string) => void
  isDeleting: boolean
  isToggling: boolean
}

function ServerRow({ server, onEdit, onDelete, onToggle, isDeleting, isToggling }: ServerRowProps) {
  const isInactive = server.status === "inactive"

  return (
    <tr
      className={`border-b last:border-0 hover:bg-muted/50 transition-colors${isInactive ? " opacity-50" : ""}`}
      aria-label={server.name}
    >
      <td className="py-3 px-4 text-sm font-medium">{server.name}</td>
      <td className="py-3 px-4">
        <Badge variant={server.server_type === "local" ? "outline" : "secondary"}>
          {server.server_type}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <Badge variant={isInactive ? "outline" : "default"}>
          {server.status}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {server.host ?? "—"}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(server)}
            aria-label={`Editar servidor ${server.name}`}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggle(server.server_id)}
            disabled={isToggling}
            aria-busy={isToggling}
            aria-label={`${isInactive ? "Habilitar" : "Deshabilitar"} servidor ${server.name}`}
          >
            {isInactive ? "Habilitar" : "Deshabilitar"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(server.server_id)}
            disabled={isDeleting}
            aria-busy={isDeleting}
            aria-label={`Eliminar servidor ${server.name}`}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── Lista principal ──────────────────────────────────────────────────────────

interface ServersListProps {
  page: number
  perPage?: number
  onPageChange: (page: number) => void
  onEdit: (server: ServerResponse) => void
  onDeleteSuccess: () => void
  onToggleSuccess: () => void
}

export function ServersList({
  page,
  perPage = 10,
  onPageChange,
  onEdit,
  onDeleteSuccess,
  onToggleSuccess,
}: ServersListProps) {
  const { servers, total, isLoading, error, refetch } = useServers(page, perPage)
  const { deleteServer, isPending: isDeleting, error: deleteError } = useDeleteServer()
  const { toggleServer, isPending: isToggling, error: toggleError } = useToggleServer()

  function handleDelete(serverId: string) {
    deleteServer(serverId, () => {
      refetch()
      onDeleteSuccess()
    })
  }

  function handleToggle(serverId: string) {
    toggleServer(serverId, () => {
      refetch()
      onToggleSuccess()
    })
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center" aria-busy="true" aria-live="polite">
        Cargando servidores...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" aria-live="polite" className="text-sm text-destructive py-6 text-center">
        {error}
      </p>
    )
  }

  if (servers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No tienes servidores todavía. Añade uno para empezar.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {(deleteError || toggleError) && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2">
          {deleteError ?? toggleError}
        </p>
      )}

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Estado</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Host</th>
              <th className="py-3 px-4 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => (
              <ServerRow
                key={server.server_id}
                server={server}
                onEdit={onEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                isDeleting={isDeleting}
                isToggling={isToggling}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} perPage={perPage} onPageChange={onPageChange} />
    </div>
  )
}
