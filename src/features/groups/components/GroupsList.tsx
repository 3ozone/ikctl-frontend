"use client"

import { useGroups } from "../hooks/useGroups"
import { useDeleteGroup } from "../hooks/useDeleteGroup"
import { Button } from "@/components/ui/button"
import type { GroupResponse } from "@/types/api"

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

// ─── Fila de grupo ────────────────────────────────────────────────────────────

interface GroupRowProps {
  group: GroupResponse
  onEdit: (group: GroupResponse) => void
  onDelete: (groupId: string) => void
  isDeleting: boolean
}

function GroupRow({ group, onEdit, onDelete, isDeleting }: GroupRowProps) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors" aria-label={group.name}>
      <td className="py-3 px-4 text-sm font-medium">{group.name}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {group.description ?? "—"}
      </td>
      <td className="py-3 px-4 text-sm text-center">
        {group.server_ids.length}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(group)}
            aria-label={`Editar grupo ${group.name}`}
          >
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(group.id)}
            disabled={isDeleting}
            aria-busy={isDeleting}
            aria-label={`Eliminar grupo ${group.name}`}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── Lista principal ──────────────────────────────────────────────────────────

interface GroupsListProps {
  page: number
  perPage?: number
  onPageChange: (page: number) => void
  onEdit: (group: GroupResponse) => void
  onDeleteSuccess: () => void
}

export function GroupsList({
  page,
  perPage = 10,
  onPageChange,
  onEdit,
  onDeleteSuccess,
}: GroupsListProps) {
  const { groups, total, isLoading, error, refetch } = useGroups(page, perPage)
  const { deleteGroup, isPending: isDeleting, error: deleteError } = useDeleteGroup()

  function handleDelete(groupId: string) {
    deleteGroup(groupId, () => {
      refetch()
      onDeleteSuccess()
    })
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center" aria-busy="true" aria-live="polite">
        Cargando grupos...
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

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No tienes grupos todavía. Crea uno para empezar.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {deleteError && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2">
          {deleteError}
        </p>
      )}

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Servidores</th>
              <th className="py-3 px-4 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onEdit={onEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} perPage={perPage} onPageChange={onPageChange} />
    </div>
  )
}
