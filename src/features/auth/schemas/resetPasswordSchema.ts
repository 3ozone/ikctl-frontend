import { z } from "zod"

const PASSWORD_RULES = z
  .string()
  .min(8, { message: "Mínimo 8 caracteres" })
  .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula" })
  .regex(/[a-z]/, { message: "Debe contener al menos una minúscula" })
  .regex(/[0-9]/, { message: "Debe contener al menos un número" })

export const resetPasswordSchema = z
  .object({
    new_password: PASSWORD_RULES,
    confirm_password: z.string().min(1, { message: "Confirma tu contraseña" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
