import { describe, it, expect } from "vitest"
import {
  createCredentialSchema,
  updateCredentialSchema,
} from "@/features/credentials/schemas/credentialSchema"

describe("createCredentialSchema", () => {
  it("acepta credencial ssh válida con private_key", () => {
    const result = createCredentialSchema.safeParse({
      name: "mi-clave-ssh",
      type: "ssh",
      username: "root",
      private_key: "-----BEGIN RSA PRIVATE KEY-----\n...",
    })
    expect(result.success).toBe(true)
  })

  it("acepta credencial ssh válida con password", () => {
    const result = createCredentialSchema.safeParse({
      name: "mi-clave-ssh",
      type: "ssh",
      username: "deploy",
      password: "s3cr3t",
    })
    expect(result.success).toBe(true)
  })

  it("acepta credencial git_https válida", () => {
    const result = createCredentialSchema.safeParse({
      name: "github-token",
      type: "git_https",
      username: "myuser",
      password: "ghp_token",
    })
    expect(result.success).toBe(true)
  })

  it("acepta credencial git_ssh válida", () => {
    const result = createCredentialSchema.safeParse({
      name: "github-ssh",
      type: "git_ssh",
      private_key: "-----BEGIN RSA PRIVATE KEY-----\n...",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    const result = createCredentialSchema.safeParse({
      name: "",
      type: "ssh",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("name")
  })

  it("rechaza tipo inválido", () => {
    const result = createCredentialSchema.safeParse({
      name: "test",
      type: "ftp",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("type")
  })

  it("rechaza git_https sin username ni password", () => {
    const result = createCredentialSchema.safeParse({
      name: "github-token",
      type: "git_https",
    })
    expect(result.success).toBe(false)
  })

  it("rechaza git_ssh sin private_key", () => {
    const result = createCredentialSchema.safeParse({
      name: "github-ssh",
      type: "git_ssh",
    })
    expect(result.success).toBe(false)
  })

  it("recorta espacios del nombre (trim)", () => {
    const result = createCredentialSchema.safeParse({
      name: "  mi-clave  ",
      type: "ssh",
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe("mi-clave")
  })
})

describe("updateCredentialSchema", () => {
  it("acepta actualización válida con name", () => {
    const result = updateCredentialSchema.safeParse({
      name: "nueva-clave",
      username: "admin",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    const result = updateCredentialSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("name")
  })
})
