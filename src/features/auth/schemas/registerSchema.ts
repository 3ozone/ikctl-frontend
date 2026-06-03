import { z } from "zod"

const PASSWORD_RULES = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .trim(),
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Introduce un email válido")
    .transform((v) => v.toLowerCase()),
  password: PASSWORD_RULES,
})

export type RegisterFormValues = z.infer<typeof registerSchema>

export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "El código debe tener exactamente 6 dígitos")
    .regex(/^\d{6}$/, "Solo se permiten dígitos"),
})

export type TwoFactorFormValues = z.infer<typeof twoFactorSchema>
