"use client"

import { useCredentials } from "../hooks/useCredentials"
import { useDeleteCredential } from "../hooks/useDeleteCredential"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CredentialResponse } from "@/types/api"

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

// ─── Fila de credencial ───────────────────────────────────────────────────────

interface CredentialRowProps {
  credential: CredentialResponse
  onEdit: (credential: CredentialResponse) => void
  onDelete: (credentialId: string) => void
  isDeleting: boolean
}

function CredentialRow({ credential, onEdit, onDelete, isDeleting }: CredentialRowProps) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium">{credential.name}</td>
      <td className="py-3 px-4">
        <Badge variant="secondary">{credential.credential_type}</Badge>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {credential.username ?? "—"}
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {new Date(credential.created_at).toLocaleDateString("es-ES")}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(credential)}
            aria-label={`Editar credencial ${credential.name}`}
          >
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(credential.credential_id)}
            disabled={isDeleting}
            aria-busy={isDeleting}
            aria-label={`Eliminar credencial ${credential.name}`}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── Lista principal ──────────────────────────────────────────────────────────

interface CredentialsListProps {
  page: number
  perPage?: number
  onPageChange: (page: number) => void
  onEdit: (credential: CredentialResponse) => void
  onDeleteSuccess: () => void
}

export function CredentialsList({
  page,
  perPage = 20,
  onPageChange,
  onEdit,
  onDeleteSuccess,
}: CredentialsListProps) {
  const { credentials, total, isLoading, error, refetch } = useCredentials(page, perPage)
  const { deleteCredential, isPending: isDeleting, error: deleteError } = useDeleteCredential()

  async function handleDelete(credentialId: string) {
    await deleteCredential(credentialId, () => {
      refetch()
      onDeleteSuccess()
    })
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center" aria-busy="true" aria-live="polite">
        Cargando credenciales...
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

  if (credentials.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No tienes credenciales todavía. Crea una para empezar.
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
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Usuario</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Creada</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {credentials.map((credential) => (
              <CredentialRow
                key={credential.credential_id}
                credential={credential}
                onEdit={onEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        onPageChange={onPageChange}
      />
    </div>
  )
}
