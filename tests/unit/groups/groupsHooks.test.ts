// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useGroups } from "@/features/groups/hooks/useGroups"
import { useCreateGroup } from "@/features/groups/hooks/useCreateGroup"
import { useUpdateGroup } from "@/features/groups/hooks/useUpdateGroup"
import { useDeleteGroup } from "@/features/groups/hooks/useDeleteGroup"
import { groupsService } from "@/features/groups/services/groupsService"
import { ApiError } from "@/lib/apiClient"
import type { GroupResponse } from "@/types/api"

vi.mock("@/features/groups/services/groupsService")

const mockGroup: GroupResponse = {
  id: "grp-123",
  user_id: "user-abc",
  name: "Production Cluster",
  description: "Servidores de producción",
  server_ids: ["srv-001", "srv-002"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

// ─── useGroups ────────────────────────────────────────────────────────────────

describe("useGroups", () => {
  beforeEach(() => vi.clearAllMocks())

  it("carga la lista de grupos correctamente", async () => {
    vi.mocked(groupsService.list).mockResolvedValueOnce({
      items: [mockGroup],
      total: 1,
      page: 1,
      per_page: 10,
    })

    const { result } = renderHook(() => useGroups())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.groups).toHaveLength(1)
    expect(result.current.total).toBe(1)
    expect(result.current.error).toBeNull()
  })

  it("establece error si la carga falla", async () => {
    vi.mocked(groupsService.list).mockRejectedValueOnce(new Error("network"))

    const { result } = renderHook(() => useGroups())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).not.toBeNull()
    expect(result.current.groups).toHaveLength(0)
  })
})

// ─── useCreateGroup ───────────────────────────────────────────────────────────

describe("useCreateGroup", () => {
  beforeEach(() => vi.clearAllMocks())

  it("llama a onSuccess tras crear correctamente", async () => {
    vi.mocked(groupsService.create).mockResolvedValueOnce(mockGroup)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useCreateGroup())
    await act(async () => {
      await result.current.createGroup(
        { name: "Production Cluster", server_ids: [] },
        onSuccess,
      )
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it("establece error genérico si falla la creación", async () => {
    vi.mocked(groupsService.create).mockRejectedValueOnce(new Error("network"))

    const { result } = renderHook(() => useCreateGroup())
    await act(async () => {
      await result.current.createGroup({ name: "Production Cluster", server_ids: [] })
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.isPending).toBe(false)
  })
})

// ─── useUpdateGroup ───────────────────────────────────────────────────────────

describe("useUpdateGroup", () => {
  beforeEach(() => vi.clearAllMocks())

  it("llama a onSuccess tras actualizar correctamente", async () => {
    vi.mocked(groupsService.update).mockResolvedValueOnce(mockGroup)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useUpdateGroup())
    await act(async () => {
      await result.current.updateGroup("grp-123", { name: "Nuevo nombre" }, onSuccess)
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it("establece error si falla la actualización", async () => {
    vi.mocked(groupsService.update).mockRejectedValueOnce(new Error("network"))

    const { result } = renderHook(() => useUpdateGroup())
    await act(async () => {
      await result.current.updateGroup("grp-123", { name: "Nuevo nombre" })
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.isPending).toBe(false)
  })
})

// ─── useDeleteGroup ───────────────────────────────────────────────────────────

describe("useDeleteGroup", () => {
  beforeEach(() => vi.clearAllMocks())

  it("llama a onSuccess tras eliminar correctamente", async () => {
    vi.mocked(groupsService.delete).mockResolvedValueOnce(undefined)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useDeleteGroup())
    await act(async () => {
      await result.current.deleteGroup("grp-123", onSuccess)
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it("establece error 409 si el grupo está vinculado a pipelines", async () => {
    vi.mocked(groupsService.delete).mockRejectedValueOnce(
      new ApiError(409, { detail: "conflict" }),
    )

    const { result } = renderHook(() => useDeleteGroup())
    await act(async () => {
      await result.current.deleteGroup("grp-123")
    })

    expect(result.current.error).toMatch(/pipeline/i)
  })
})
