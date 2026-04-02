"use client"

import { useEffect } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  registerServerSchema,
  registerLocalServerSchema,
  updateServerSchema,
  type RegisterServerFormValues,
  type RegisterLocalServerFormValues,
  type UpdateServerFormValues,
} from "../schemas/serverSchema"
import { useCreateServer } from "../hooks/useCreateServer"
import { useUpdateServer } from "../hooks/useUpdateServer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ServerResponse } from "@/types/api"

// ─── Props ────────────────────────────────────────────────────────────────────

interface RegisterServerFormProps {
  server?: ServerResponse
  onSuccess: () => void
  onCancel: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function RegisterServerForm({ server, onSuccess, onCancel }: RegisterServerFormProps) {
  const isEditMode = !!server

  const { createServer, isPending: isCreating, error: createError } = useCreateServer()
  const { updateServer, isPending: isUpdating, error: updateError } = useUpdateServer()

  const isPending = isCreating || isUpdating
  const error = createError ?? updateError

  // ── Formulario creación (remote) ─────────────────────────────────────────────

  const createRemoteForm = useForm<RegisterServerFormValues>({
    resolver: zodResolver(registerServerSchema) as Resolver<RegisterServerFormValues>,
    defaultValues: { name: "", host: "", port: 22, credential_id: "", description: "" },
  })

  // ── Formulario creación (local) ──────────────────────────────────────────────

  const createLocalForm = useForm<RegisterLocalServerFormValues>({
    resolver: zodResolver(registerLocalServerSchema),
    defaultValues: { name: "", description: "" },
  })

  // ── Formulario edición ───────────────────────────────────────────────────────

  const updateForm = useForm<UpdateServerFormValues>({
    resolver: zodResolver(updateServerSchema) as Resolver<UpdateServerFormValues>,
    defaultValues: {
      name: server?.name ?? "",
      host: server?.host ?? "",
      port: server?.port ?? 22,
      credential_id: server?.credential_id ?? "",
      description: server?.description ?? "",
    },
  })

  useEffect(() => {
    if (server) {
      updateForm.reset({
        name: server.name,
        host: server.host ?? "",
        port: server.port ?? 22,
        credential_id: server.credential_id ?? "",
        description: server.description ?? "",
      })
    }
  }, [server, updateForm])

  // ── Tipo seleccionado (solo modo creación) ────────────────────────────────────

  // usamos un campo separado para el selector de tipo
  const typeSelector = useForm<{ type: "remote" | "local" }>({
    defaultValues: { type: "remote" },
  })
  const selectedServerType = useWatch({ control: typeSelector.control, name: "type" })

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleCreateRemote(values: RegisterServerFormValues) {
    createServer({ ...values, type: "remote" }, onSuccess)
  }

  function handleCreateLocal(values: RegisterLocalServerFormValues) {
    createServer({ ...values, type: "local" }, onSuccess)
  }

  function handleUpdate(values: UpdateServerFormValues) {
    if (!server) return
    updateServer(server.id, values, onSuccess)
  }

  // ─── Modo edición ─────────────────────────────────────────────────────────────

  if (isEditMode) {
    const isLocal = server.type === "local"

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

        {!isLocal && (
          <>
            <div className="mb-4">
              <Label htmlFor="edit-host">Host</Label>
              <Input id="edit-host" {...updateForm.register("host")} />
            </div>
            <div className="mb-4">
              <Label htmlFor="edit-port">Puerto</Label>
              <Input id="edit-port" type="number" {...updateForm.register("port")} />
            </div>
          </>
        )}

        <div className="mb-4">
          <Label htmlFor="edit-description">Descripción</Label>
          <Input id="edit-description" {...updateForm.register("description")} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    )
  }

  // ─── Modo creación ─────────────────────────────────────────────────────────────

  const isLocal = selectedServerType === "local"

  return (
    <form
      onSubmit={
        isLocal
          ? createLocalForm.handleSubmit(handleCreateLocal)
          : createRemoteForm.handleSubmit(handleCreateRemote)
      }
      noValidate
    >
      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Label htmlFor="create-type">Tipo de servidor</Label>
        <select
          id="create-type"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          {...typeSelector.register("type")}
        >
          <option value="remote">Remote</option>
          <option value="local">Local</option>
        </select>
      </div>

      <div className="mb-4">
        <Label htmlFor="create-name">Nombre</Label>
        <Input
          id="create-name"
          {...(isLocal ? createLocalForm.register("name") : createRemoteForm.register("name"))}
          aria-describedby={
            (isLocal ? createLocalForm.formState.errors.name : createRemoteForm.formState.errors.name)
              ? "create-name-error"
              : undefined
          }
        />
        {(isLocal ? createLocalForm.formState.errors.name : createRemoteForm.formState.errors.name) && (
          <p id="create-name-error" className="mt-1 text-xs text-red-600">
            {(isLocal ? createLocalForm.formState.errors.name : createRemoteForm.formState.errors.name)?.message}
          </p>
        )}
      </div>

      {!isLocal && (
        <>
          <div className="mb-4">
            <Label htmlFor="create-host">Host</Label>
            <Input
              id="create-host"
              {...createRemoteForm.register("host")}
              aria-describedby={
                createRemoteForm.formState.errors.host ? "create-host-error" : undefined
              }
            />
            {createRemoteForm.formState.errors.host && (
              <p id="create-host-error" className="mt-1 text-xs text-red-600">
                {createRemoteForm.formState.errors.host.message}
              </p>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="create-port">Puerto</Label>
            <Input
              id="create-port"
              type="number"
              {...createRemoteForm.register("port")}
            />
          </div>
        </>
      )}

      <div className="mb-4">
        <Label htmlFor="create-description">Descripción</Label>
        <Input
          id="create-description"
          {...(isLocal ? createLocalForm.register("description") : createRemoteForm.register("description"))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando…" : "Crear servidor"}
        </Button>
      </div>
    </form>
  )
}
