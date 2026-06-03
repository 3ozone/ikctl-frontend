import { describe, it, expect } from "vitest"
import { groupSchema, updateGroupSchema } from "@/features/groups/schemas/groupSchema"

describe("groupSchema (crear grupo)", () => {
  const valid = {
    name: "Production Cluster",
    description: "Todos los servidores de producción",
    server_ids: ["srv-001", "srv-002"],
  }

  it("acepta datos válidos", () => {
    expect(groupSchema.safeParse(valid).success).toBe(true)
  })

  it("acepta sin description", () => {
    const { description: _, ...rest } = valid
    expect(groupSchema.safeParse(rest).success).toBe(true)
  })

  it("acepta sin server_ids (array vacío por defecto)", () => {
    const { server_ids: _, ...rest } = valid
    const result = groupSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.server_ids).toEqual([])
  })

  it("rechaza nombre vacío", () => {
    expect(groupSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("rechaza nombre de más de 255 caracteres", () => {
    expect(groupSchema.safeParse({ ...valid, name: "a".repeat(256) }).success).toBe(false)
  })

  it("acepta server_ids como array vacío", () => {
    expect(groupSchema.safeParse({ ...valid, server_ids: [] }).success).toBe(true)
  })

  it("acepta description opcional como string vacío", () => {
    expect(groupSchema.safeParse({ ...valid, description: "" }).success).toBe(true)
  })
})

describe("updateGroupSchema (editar grupo)", () => {
  const valid = {
    name: "Nuevo nombre",
    description: "Descripción actualizada",
    server_ids: ["srv-003"],
  }

  it("acepta datos válidos", () => {
    expect(updateGroupSchema.safeParse(valid).success).toBe(true)
  })

  it("acepta sin description", () => {
    const { description: _, ...rest } = valid
    expect(updateGroupSchema.safeParse(rest).success).toBe(true)
  })

  it("acepta sin server_ids", () => {
    const { server_ids: _, ...rest } = valid
    expect(updateGroupSchema.safeParse(rest).success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    expect(updateGroupSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("rechaza nombre de más de 255 caracteres", () => {
    expect(updateGroupSchema.safeParse({ ...valid, name: "a".repeat(256) }).success).toBe(false)
  })
})
