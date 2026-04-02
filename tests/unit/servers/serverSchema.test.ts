import { describe, it, expect } from "vitest"
import {
  registerServerSchema,
  registerLocalServerSchema,
  updateServerSchema,
  adHocCommandSchema,
} from "@/features/servers/schemas/serverSchema"

describe("registerServerSchema (servidor remoto)", () => {
  const validRemote = {
    name: "mi-servidor",
    host: "192.168.1.1",
    port: 22,
    credential_id: "cred-123",
    description: "",
  }

  it("acepta datos válidos", () => {
    expect(registerServerSchema.safeParse(validRemote).success).toBe(true)
  })

  it("acepta sin description", () => {
    const { description: _, ...rest } = validRemote
    expect(registerServerSchema.safeParse(rest).success).toBe(true)
  })

  it("acepta sin credential_id", () => {
    const { credential_id: _, ...rest } = validRemote
    expect(registerServerSchema.safeParse(rest).success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    expect(registerServerSchema.safeParse({ ...validRemote, name: "" }).success).toBe(false)
  })

  it("rechaza nombre de más de 255 caracteres", () => {
    expect(
      registerServerSchema.safeParse({ ...validRemote, name: "a".repeat(256) }).success,
    ).toBe(false)
  })

  it("rechaza host vacío", () => {
    expect(registerServerSchema.safeParse({ ...validRemote, host: "" }).success).toBe(false)
  })

  it("rechaza puerto 0", () => {
    expect(registerServerSchema.safeParse({ ...validRemote, port: 0 }).success).toBe(false)
  })

  it("rechaza puerto > 65535", () => {
    expect(registerServerSchema.safeParse({ ...validRemote, port: 65536 }).success).toBe(false)
  })

  it("usa puerto 22 por defecto si no se proporciona", () => {
    const { port: _, ...rest } = validRemote
    const result = registerServerSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.port).toBe(22)
  })
})

describe("registerLocalServerSchema (servidor local)", () => {
  it("acepta datos válidos", () => {
    expect(registerLocalServerSchema.safeParse({ name: "local" }).success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    expect(registerLocalServerSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("acepta description opcional", () => {
    expect(
      registerLocalServerSchema.safeParse({ name: "local", description: "desc" }).success,
    ).toBe(true)
  })
})

describe("updateServerSchema", () => {
  const valid = { name: "nuevo-nombre", host: "10.0.0.1", port: 22 }

  it("acepta datos válidos", () => {
    expect(updateServerSchema.safeParse(valid).success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    expect(updateServerSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("rechaza puerto fuera de rango", () => {
    expect(updateServerSchema.safeParse({ ...valid, port: 70000 }).success).toBe(false)
  })
})

describe("adHocCommandSchema", () => {
  const valid = { command: "ls -la", sudo: false, timeout: 30 }

  it("acepta datos válidos", () => {
    expect(adHocCommandSchema.safeParse(valid).success).toBe(true)
  })

  it("rechaza comando vacío", () => {
    expect(adHocCommandSchema.safeParse({ ...valid, command: "" }).success).toBe(false)
  })

  it("rechaza comando de más de 2048 caracteres", () => {
    expect(
      adHocCommandSchema.safeParse({ ...valid, command: "a".repeat(2049) }).success,
    ).toBe(false)
  })

  it("rechaza timeout 0", () => {
    expect(adHocCommandSchema.safeParse({ ...valid, timeout: 0 }).success).toBe(false)
  })

  it("rechaza timeout > 600", () => {
    expect(adHocCommandSchema.safeParse({ ...valid, timeout: 601 }).success).toBe(false)
  })

  it("usa timeout 30 por defecto", () => {
    const { timeout: _, ...rest } = valid
    const result = adHocCommandSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.timeout).toBe(30)
  })

  it("usa sudo false por defecto", () => {
    const { sudo: _, ...rest } = valid
    const result = adHocCommandSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sudo).toBe(false)
  })
})
