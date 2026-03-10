import { z } from "zod"

export const verifyEmailSchema = z.object({
  token: z.string().min(1, { message: "El token de verificación es requerido" }),
})

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido" })
    .email({ message: "Introduce un email válido" })
    .transform((v) => v.toLowerCase()),
})

export type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>
