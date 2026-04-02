"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createCredentialSchema,
  updateCredentialSchema,
  CREDENTIAL_TYPES,
  type CreateCredentialFormValues,
  type UpdateCredentialFormValues,
} from "../schemas/credentialSchema"
import { useCreateCredential } from "../hooks/useCreateCredential"
import { useUpdateCredential } from "../hooks/useUpdateCredential"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CredentialResponse } from "@/types/api"

// ─── Props ────────────────────────────────────────────────────────────────────

interface CredentialFormProps {
  credential?: CredentialResponse
  onSuccess: () => void
  onCancel: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CredentialForm({ credential, onSuccess, onCancel }: CredentialFormProps) {
  const isEditMode = !!credential

  const { createCredential, isPending: isCreating, error: createError } = useCreateCredential()
  const { updateCredential, isPending: isUpdating, error: updateError } = useUpdateCredential()

  const isPending = isCreating || isUpdating
  const error = createError ?? updateError

  // ── Formulario creación ──────────────────────────────────────────────────────

  const createForm = useForm<CreateCredentialFormValues>({
    resolver: zodResolver(createCredentialSchema),
    defaultValues: {
      name: "",
      type: "ssh",
      username: "",
      password: "",
      private_key: "",
    },
  })

  // ── Formulario edición ───────────────────────────────────────────────────────

  const updateForm = useForm<UpdateCredentialFormValues>({
    resolver: zodResolver(updateCredentialSchema),
    defaultValues: {
      name: credential?.name ?? "",
      username: credential?.username ?? "",
      password: "",
      private_key: "",
    },
  })

  useEffect(() => {
    if (credential) {
      updateForm.reset({
        name: credential.name,
        username: credential.username ?? "",
        password: "",
        private_key: "",
      })
    }
  }, [credential, updateForm])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleCreate(values: CreateCredentialFormValues) {
    createCredential(values, onSuccess)
  }

  function handleUpdate(values: UpdateCredentialFormValues) {
    if (!credential) return
    updateCredential(credential.credential_id, values, onSuccess)
  }

  // ── Tipo seleccionado (solo modo creación) ────────────────────────────────────

  const selectedType = createForm.watch("type")

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isEditMode) {
    return (
      <form onSubmit={updateForm.handleSubmit(handleUpdate)} noValidate>
        {error && (
          <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4">
          <Label htmlFor="edit-name">Nombre</Label>
          <Input
            id="edit-name"
            {...updateForm.register("name")}
            aria-describedby={updateForm.formState.errors.name ? "edit-name-error" : undefined}
          />
          {updateForm.formState.errors.name && (
            <p id="edit-name-error" className="mt-1 text-xs text-red-600">
              {updateForm.formState.errors.name.message}
            </p>
          )}
        </div>

        {credential.credential_type === "git_https" && (
          <>
            <div className="mb-4">
              <Label htmlFor="edit-username">Usuario</Label>
              <Input id="edit-username" {...updateForm.register("username")} />
            </div>
            <div className="mb-4">
              <Label htmlFor="edit-password">Contraseña</Label>
              <Input id="edit-password" type="password" {...updateForm.register("password")} />
            </div>
          </>
        )}

        {credential.credential_type === "git_ssh" && (
          <div className="mb-4">
            <Label htmlFor="edit-private-key">Clave privada</Label>
            <textarea
              id="edit-private-key"
              rows={6}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
              {...updateForm.register("private_key")}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    )
  }

  // ── Modo creación ─────────────────────────────────────────────────────────────

  return (
    <form onSubmit={createForm.handleSubmit(handleCreate)} noValidate>
      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Label htmlFor="create-name">Nombre</Label>
        <Input
          id="create-name"
          {...createForm.register("name")}
          aria-describedby={createForm.formState.errors.name ? "create-name-error" : undefined}
        />
        {createForm.formState.errors.name && (
          <p id="create-name-error" className="mt-1 text-xs text-red-600">
            {createForm.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <Label htmlFor="create-type">Tipo</Label>
        <select
          id="create-type"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          {...createForm.register("type")}
        >
          {CREDENTIAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {selectedType === "git_https" && (
        <>
          <div className="mb-4">
            <Label htmlFor="create-username">Usuario</Label>
            <Input id="create-username" {...createForm.register("username")} />
          </div>
          <div className="mb-4">
            <Label htmlFor="create-password">Contraseña</Label>
            <Input id="create-password" type="password" {...createForm.register("password")} />
          </div>
        </>
      )}

      {selectedType === "git_ssh" && (
        <div className="mb-4">
          <Label htmlFor="create-private-key">Clave privada</Label>
          <textarea
            id="create-private-key"
            rows={6}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
            {...createForm.register("private_key")}
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
