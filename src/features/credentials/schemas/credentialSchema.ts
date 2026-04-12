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
  .superRefine((data, ctx) => {
    if (data.type === "ssh") {
      if (!data.username) {
        ctx.addIssue({
          code: "custom",
          message: "ssh requiere un usuario",
          path: ["username"],
        })
      }
      if (!data.password && !data.private_key) {
        ctx.addIssue({
          code: "custom",
          message: "ssh requiere contraseña o clave privada",
          path: ["password"],
        })
      }
    }
    if (data.type === "git_https" && (!data.username || !data.password)) {
      ctx.addIssue({
        code: "custom",
        message: "git_https requiere usuario y contraseña",
        path: ["password"],
      })
    }
    if (data.type === "git_ssh" && !data.private_key) {
      ctx.addIssue({
        code: "custom",
        message: "git_ssh requiere una clave privada",
        path: ["private_key"],
      })
    }
  })

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
