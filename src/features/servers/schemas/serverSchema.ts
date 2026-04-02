import { z } from "zod"

// ─── Servidor remoto ──────────────────────────────────────────────────────────

export const registerServerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres")
    .trim(),
  host: z
    .string()
    .min(1, "El host es requerido")
    .max(255, "El host no puede superar los 255 caracteres")
    .trim(),
  port: z.coerce
    .number()
    .int()
    .min(1, "El puerto debe ser mayor que 0")
    .max(65535, "El puerto no puede superar 65535")
    .default(22),
  credential_id: z.string().optional(),
  description: z.string().optional(),
})

export type RegisterServerFormValues = z.infer<typeof registerServerSchema>

// ─── Servidor local ───────────────────────────────────────────────────────────

export const registerLocalServerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres")
    .trim(),
  description: z.string().optional(),
})

export type RegisterLocalServerFormValues = z.infer<typeof registerLocalServerSchema>

// ─── Actualizar servidor ──────────────────────────────────────────────────────

export const updateServerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres")
    .trim(),
  host: z
    .string()
    .max(255, "El host no puede superar los 255 caracteres")
    .trim()
    .optional(),
  port: z.coerce
    .number()
    .int()
    .min(1, "El puerto debe ser mayor que 0")
    .max(65535, "El puerto no puede superar 65535")
    .optional(),
  credential_id: z.string().optional(),
  description: z.string().optional(),
})

export type UpdateServerFormValues = z.infer<typeof updateServerSchema>

// ─── Comando ad-hoc ───────────────────────────────────────────────────────────

export const adHocCommandSchema = z.object({
  command: z
    .string()
    .min(1, "El comando es requerido")
    .max(2048, "El comando no puede superar los 2048 caracteres"),
  sudo: z.boolean().default(false),
  timeout: z.coerce
    .number()
    .int()
    .min(1, "El timeout debe ser al menos 1 segundo")
    .max(600, "El timeout no puede superar los 600 segundos")
    .default(30),
})

export type AdHocCommandFormValues = z.infer<typeof adHocCommandSchema>
