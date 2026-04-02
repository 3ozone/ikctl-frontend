import { z } from "zod"

export const CREDENTIAL_TYPES = ["ssh", "git_https", "git_ssh"] as const
export type CredentialType = (typeof CREDENTIAL_TYPES)[number]

export const createCredentialSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre es requerido")
      .max(255, "El nombre no puede superar los 255 caracteres")
      .trim(),
    type: z.enum(CREDENTIAL_TYPES, {
      error: "El tipo debe ser ssh, git_https o git_ssh",
    }),
    username: z
      .string()
      .max(255, "El usuario no puede superar los 255 caracteres")
      .trim()
      .optional(),
    password: z
      .string()
      .max(1024, "La contraseña no puede superar los 1024 caracteres")
      .optional(),
    private_key: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "ssh") return true // ssh puede usar password o private_key
      if (data.type === "git_https") return !!data.username && !!data.password
      if (data.type === "git_ssh") return !!data.private_key
      return true
    },
    (data) => ({
      message:
        data.type === "git_https"
          ? "git_https requiere usuario y contraseña"
          : "git_ssh requiere una clave privada",
      path: data.type === "git_https" ? ["password"] : ["private_key"],
    }),
  )

export const updateCredentialSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres")
    .trim(),
  username: z
    .string()
    .max(255, "El usuario no puede superar los 255 caracteres")
    .trim()
    .optional(),
  password: z
    .string()
    .max(1024, "La contraseña no puede superar los 1024 caracteres")
    .optional(),
  private_key: z.string().optional(),
})

export type CreateCredentialFormValues = z.infer<typeof createCredentialSchema>
export type UpdateCredentialFormValues = z.infer<typeof updateCredentialSchema>
