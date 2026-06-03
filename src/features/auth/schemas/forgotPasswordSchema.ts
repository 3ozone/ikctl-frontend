import { z } from "zod"

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido" })
    .email({ message: "Introduce un email válido" })
    .transform((v) => v.toLowerCase()),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
