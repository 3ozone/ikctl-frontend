"use client"

import { useEffect } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  groupSchema,
  updateGroupSchema,
  type GroupFormValues,
  type UpdateGroupFormValues,
} from "../schemas/groupSchema"
import { useCreateGroup } from "../hooks/useCreateGroup"
import { useUpdateGroup } from "../hooks/useUpdateGroup"
import { useServers } from "@/features/servers/hooks/useServers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { GroupResponse } from "@/types/api"

// ─── Props ────────────────────────────────────────────────────────────────────

interface GroupFormProps {
  group?: GroupResponse
  onSuccess: () => void
  onCancel: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const isEditMode = !!group

  const { createGroup, isPending: isCreating, error: createError } = useCreateGroup()
  const { updateGroup, isPending: isUpdating, error: updateError } = useUpdateGroup()
  const { servers } = useServers(1, 100)

  const isPending = isCreating || isUpdating
  const error = createError ?? updateError

  // Solo servidores activos (RF-43)
  const activeServers = servers.filter((s) => s.status === "active")

  // ── Formulario creación ───────────────────────────────────────────────────────

  const createForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema) as Resolver<GroupFormValues>,
    defaultValues: { name: "", description: "", server_ids: [] },
  })

  // ── Formulario edición ────────────────────────────────────────────────────────

  const updateForm = useForm<UpdateGroupFormValues>({
    resolver: zodResolver(updateGroupSchema) as Resolver<UpdateGroupFormValues>,
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
      server_ids: group?.server_ids ?? [],
    },
  })

  useEffect(() => {
    if (group) {
      updateForm.reset({
        name: group.name,
        description: group.description ?? "",
        server_ids: group.server_ids,
      })
    }
  }, [group, updateForm])

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleCreate(values: GroupFormValues) {
    createGroup(values, onSuccess)
  }

  function handleUpdate(values: UpdateGroupFormValues) {
    if (!group) return
    updateGroup(group.id, values, onSuccess)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const onSubmit = isEditMode
    ? updateForm.handleSubmit(handleUpdate)
    : createForm.handleSubmit(handleCreate)

  const createServerIds = useWatch({ control: createForm.control, name: "server_ids" }) ?? []
  const updateServerIds = useWatch({ control: updateForm.control, name: "server_ids" }) ?? []
  const selectedIds: string[] = isEditMode ? (updateServerIds ?? []) : createServerIds

  function toggleServer(serverId: string) {
    const next = selectedIds.includes(serverId)
      ? selectedIds.filter((id) => id !== serverId)
      : [...selectedIds, serverId]
    if (isEditMode) {
      updateForm.setValue("server_ids", next)
    } else {
      createForm.setValue("server_ids", next)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Label htmlFor="group-name">Nombre</Label>
        <Input
          id="group-name"
          {...(isEditMode ? updateForm.register("name") : createForm.register("name"))}
          aria-describedby={
            (isEditMode ? updateForm.formState.errors.name : createForm.formState.errors.name)
              ? "group-name-error"
              : undefined
          }
        />
        {(isEditMode ? updateForm.formState.errors.name : createForm.formState.errors.name) && (
          <p id="group-name-error" className="mt-1 text-xs text-red-600">
            {(isEditMode ? updateForm.formState.errors.name : createForm.formState.errors.name)?.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <Label htmlFor="group-description">Descripción</Label>
        <Input id="group-description" {...(isEditMode ? updateForm.register("description") : createForm.register("description"))} />
      </div>

      {activeServers.length > 0 && (
        <div className="mb-4">
          <Label>Servidores</Label>
          <div className="mt-2 space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
            {activeServers.map((server) => (
              <label key={server.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(server.id)}
                  onChange={() => toggleServer(server.id)}
                  aria-label={server.name}
                />
                <span>{server.name}</span>
                {server.host && (
                  <span className="text-muted-foreground text-xs">({server.host})</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditMode ? "Guardando…" : "Creando…"
            : isEditMode ? "Guardar cambios" : "Crear grupo"}
        </Button>
      </div>
    </form>
  )
}
