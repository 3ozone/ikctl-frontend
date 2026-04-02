// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useServerHealth } from "@/features/servers/hooks/useServerHealth"
import { useAdHocCommand } from "@/features/servers/hooks/useAdHocCommand"
import { serversService } from "@/features/servers/services/serversService"
import { ApiError } from "@/lib/apiClient"
import type { HealthCheckResponse, AdHocCommandResponse } from "@/types/api"

vi.mock("@/features/servers/services/serversService")

const mockHealth: HealthCheckResponse = {
  status: "online",
  latency_ms: 12,
  os_id: "ubuntu",
  os_version: "22.04",
  os_name: "Ubuntu 22.04 LTS",
}

const mockCommandResult: AdHocCommandResponse = {
  stdout: "hello world\n",
  stderr: "",
  exit_code: 0,
}

// ─── useServerHealth ──────────────────────────────────────────────────────────

describe("useServerHealth", () => {
  beforeEach(() => vi.clearAllMocks())

  it("estado inicial sin resultado ni error", () => {
    const { result } = renderHook(() => useServerHealth())

    expect(result.current.health).toBeNull()
    expect(result.current.isPending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("devuelve el resultado del health check al ejecutar checkHealth", async () => {
    vi.mocked(serversService.health).mockResolvedValueOnce(mockHealth)

    const { result } = renderHook(() => useServerHealth())

    await act(async () => {
      await result.current.checkHealth("srv-001")
    })

    expect(result.current.health).toEqual(mockHealth)
    expect(result.current.error).toBeNull()
  })

  it("establece error si el health check falla con 404", async () => {
    vi.mocked(serversService.health).mockRejectedValueOnce(
      new ApiError(404, { detail: "not found" }),
    )

    const { result } = renderHook(() => useServerHealth())

    await act(async () => {
      await result.current.checkHealth("srv-001")
    })

    expect(result.current.health).toBeNull()
    expect(result.current.error).toMatch(/no encontrado/i)
  })

  it("establece error genérico si el health check falla con otro error", async () => {
    vi.mocked(serversService.health).mockRejectedValueOnce(new Error("network"))

    const { result } = renderHook(() => useServerHealth())

    await act(async () => {
      await result.current.checkHealth("srv-001")
    })

    expect(result.current.error).not.toBeNull()
  })
})

// ─── useAdHocCommand ──────────────────────────────────────────────────────────

describe("useAdHocCommand", () => {
  beforeEach(() => vi.clearAllMocks())

  it("estado inicial sin resultado ni error", () => {
    const { result } = renderHook(() => useAdHocCommand())

    expect(result.current.commandResult).toBeNull()
    expect(result.current.isPending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("devuelve stdout/stderr/exit_code al ejecutar el comando", async () => {
    vi.mocked(serversService.exec).mockResolvedValueOnce(mockCommandResult)

    const { result } = renderHook(() => useAdHocCommand())

    await act(async () => {
      await result.current.execCommand("srv-001", {
        command: "echo hello",
        sudo: false,
        timeout: 30,
      })
    })

    expect(result.current.commandResult).toEqual(mockCommandResult)
    expect(result.current.error).toBeNull()
  })

  it("establece error si el servidor no se encuentra (404)", async () => {
    vi.mocked(serversService.exec).mockRejectedValueOnce(
      new ApiError(404, { detail: "not found" }),
    )

    const { result } = renderHook(() => useAdHocCommand())

    await act(async () => {
      await result.current.execCommand("srv-001", {
        command: "ls",
        sudo: false,
        timeout: 30,
      })
    })

    expect(result.current.commandResult).toBeNull()
    expect(result.current.error).toMatch(/no encontrado/i)
  })

  it("establece error si el comando falla con 422 (timeout/permisos)", async () => {
    vi.mocked(serversService.exec).mockRejectedValueOnce(
      new ApiError(422, { detail: "timeout" }),
    )

    const { result } = renderHook(() => useAdHocCommand())

    await act(async () => {
      await result.current.execCommand("srv-001", {
        command: "sleep 99",
        sudo: false,
        timeout: 5,
      })
    })

    expect(result.current.error).not.toBeNull()
  })
})
