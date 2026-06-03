// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useServer } from "@/features/servers/hooks/useServer"
import { useServers } from "@/features/servers/hooks/useServers"
import { useCreateServer } from "@/features/servers/hooks/useCreateServer"
import { useUpdateServer } from "@/features/servers/hooks/useUpdateServer"
import { useDeleteServer } from "@/features/servers/hooks/useDeleteServer"
import { useToggleServer } from "@/features/servers/hooks/useToggleServer"
import { serversService } from "@/features/servers/services/serversService"
import { ApiError } from "@/lib/apiClient"
import type { ServerResponse } from "@/types/api"

vi.mock("@/features/servers/services/serversService")

const mockServer: ServerResponse = {
  id: "srv-123",
  user_id: "user-abc",
  name: "web-01",
  server_type: "remote",
  host: "192.168.1.10",
  port: 22,
  credential_id: null,
  description: null,
  status: "active",
  os_id: null,
  os_version: null,
  os_name: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

// ─── useServers ───────────────────────────────────────────────────────────────

describe("useServers", () => {
  beforeEach(() => vi.clearAllMocks())

  it("carga la lista de servidores correctamente", async () => {
    vi.mocked(serversService.list).mockResolvedValueOnce({
      items: [mockServer],
      total: 1,
      page: 1,
      per_page: 10,
    })

    const { result } = renderHook(() => useServers())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.servers).toHaveLength(1)
    expect(result.current.total).toBe(1)
    expect(result.current.error).toBeNull()
  })

  it("establece error si la carga falla", async () => {
    vi.mocked(serversService.list).mockRejectedValueOnce(new Error("network"))

    const { result } = renderHook(() => useServers())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).not.toBeNull()
    expect(result.current.servers).toHaveLength(0)
  })
})

// ─── useCreateServer ──────────────────────────────────────────────────────────

describe("useCreateServer", () => {
  beforeEach(() => vi.clearAllMocks())

  it("llama a onSuccess tras crear correctamente", async () => {
    vi.mocked(serversService.create).mockResolvedValueOnce(mockServer)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useCreateServer())
    await act(async () => {
      await result.current.createServer(
        { name: "web-01", type: "remote", host: "1.2.3.4", port: 22 },
        onSuccess,
      )
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it("establece error 409 si el nombre ya existe", async () => {
    vi.mocked(serversService.create).mockRejectedValueOnce(
      new ApiError(409, { detail: "conflict" }),
    )

    const { result } = renderHook(() => useCreateServer())
    await act(async () => {
      await result.current.createServer(
        { name: "web-01", type: "remote", host: "1.2.3.4", port: 22 },
      )
    })

    expect(result.current.error).toMatch(/ya existe/i)
  })

  it("establece error 409 especial para servidor local duplicado", async () => {
    vi.mocked(serversService.create).mockRejectedValueOnce(
      new ApiError(409, { detail: "local_exists" }),
    )

    const { result } = renderHook(() => useCreateServer())
    await act(async () => {
      await result.current.createServer({ name: "local", type: "local" })
    })

    expect(result.current.error).toMatch(/ya existe un servidor local/i)
  })
})

// ─── useUpdateServer ──────────────────────────────────────────────────────────

describe("useUpdateServer", () => {
  beforeEach(() => vi.clearAllMocks())

  it("llama a onSuccess tras actualizar correctamente", async () => {
    vi.mocked(serversService.update).mockResolvedValueOnce(mockServer)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useUpdateServer())
    await act(async () => {
      await result.current.updateServer("srv-123", { name: "web-02" }, onSuccess)
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it("establece error 404 si no se encuentra el servidor", async () => {
    vi.mocked(serversService.update).mockRejectedValueOnce(
      new ApiError(404, { detail: "not found" }),
    )

    const { result } = renderHook(() => useUpdateServer())
    await act(async () => {
      await result.current.updateServer("srv-123", { name: "web-02" })
    })

    expect(result.current.error).toMatch(/no encontrado/)
  })
})

// ─── useDeleteServer ──────────────────────────────────────────────────────────

describe("useDeleteServer", () => {
  beforeEach(() => vi.clearAllMocks())

  it("llama a onSuccess tras eliminar correctamente", async () => {
    vi.mocked(serversService.delete).mockResolvedValueOnce(undefined)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useDeleteServer())
    await act(async () => {
      await result.current.deleteServer("srv-123", onSuccess)
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it("establece error 409 si el servidor está en uso", async () => {
    vi.mocked(serversService.delete).mockRejectedValueOnce(
      new ApiError(409, { detail: "in use" }),
    )

    const { result } = renderHook(() => useDeleteServer())
    await act(async () => {
      await result.current.deleteServer("srv-123")
    })

    expect(result.current.error).toMatch(/en uso/)
  })
})

// ─── useToggleServer ──────────────────────────────────────────────────────────

describe("useToggleServer", () => {
  beforeEach(() => vi.clearAllMocks())

  it("llama a onSuccess tras toggle correctamente", async () => {
    const toggled = { ...mockServer, status: "inactive" as const }
    vi.mocked(serversService.toggle).mockResolvedValueOnce(toggled)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useToggleServer())
    await act(async () => {
      await result.current.toggleServer("srv-123", onSuccess)
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it("establece error si el toggle falla", async () => {
    vi.mocked(serversService.toggle).mockRejectedValueOnce(
      new ApiError(404, { detail: "not found" }),
    )

    const { result } = renderHook(() => useToggleServer())
    await act(async () => {
      await result.current.toggleServer("srv-123")
    })

    expect(result.current.error).not.toBeNull()
  })
})

// ─── useServer ────────────────────────────────────────────────────────────────

describe("useServer", () => {
  beforeEach(() => vi.clearAllMocks())

  it("carga el detalle del servidor correctamente", async () => {
    vi.mocked(serversService.get).mockResolvedValueOnce(mockServer)

    const { result } = renderHook(() => useServer("srv-123"))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.server).toEqual(mockServer)
    expect(result.current.error).toBeNull()
  })

  it("establece error 404 si el servidor no existe", async () => {
    vi.mocked(serversService.get).mockRejectedValueOnce(
      new ApiError(404, { detail: "not found" }),
    )

    const { result } = renderHook(() => useServer("srv-999"))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.server).toBeNull()
    expect(result.current.error).toMatch(/no encontrado/i)
  })

  it("establece error genérico si la carga falla", async () => {
    vi.mocked(serversService.get).mockRejectedValueOnce(new Error("network"))

    const { result } = renderHook(() => useServer("srv-123"))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).not.toBeNull()
  })
})
