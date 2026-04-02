import { z } from "zod"

// ─── Crear grupo ──────────────────────────────────────────────────────────────

export const groupSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres")
    .trim(),
  description: z.string().optional(),
  server_ids: z.array(z.string()).default([]),
})

export type GroupFormValues = z.infer<typeof groupSchema>

// ─── Editar grupo ─────────────────────────────────────────────────────────────

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres")
    .trim(),
  description: z.string().optional(),
  server_ids: z.array(z.string()).optional(),
})

export type UpdateGroupFormValues = z.infer<typeof updateGroupSchema>
