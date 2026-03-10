import { z } from "zod"

// ─── T-30: Editar nombre de perfil ────────────────────────────────────────────

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre no puede superar los 100 caracteres" })
    .trim(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

// ─── T-31: Cambiar contraseña ─────────────────────────────────────────────────

const PASSWORD_RULES = z
  .string()
  .min(8, { message: "Mínimo 8 caracteres" })
  .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula" })
  .regex(/[a-z]/, { message: "Debe contener al menos una minúscula" })
  .regex(/[0-9]/, { message: "Debe contener al menos un número" })

export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, { message: "La contraseña actual es requerida" }),
    new_password: PASSWORD_RULES,
    confirm_password: z
      .string()
      .min(1, { message: "Confirma tu nueva contraseña" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "La nueva contraseña debe ser distinta a la actual",
    path: ["new_password"],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

// ─── T-32: Confirmar activación de 2FA ────────────────────────────────────────

export const enable2FAVerifySchema = z.object({
  code: z
    .string()
    .length(6, { message: "El código debe tener exactamente 6 dígitos" })
    .regex(/^\d{6}$/, { message: "Solo se permiten dígitos" }),
})

export type Enable2FAVerifyFormValues = z.infer<typeof enable2FAVerifySchema>

// ─── Desactivar 2FA ───────────────────────────────────────────────────────────

export const disable2FASchema = z.object({
  code: z
    .string()
    .length(6, { message: "El código debe tener exactamente 6 dígitos" })
    .regex(/^\d{6}$/, { message: "Solo se permiten dígitos" }),
})

export type Disable2FAFormValues = z.infer<typeof disable2FASchema>
