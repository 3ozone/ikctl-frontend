import { describe, it, expect, vi, beforeEach } from "vitest"
import { serversService } from "@/features/servers/services/serversService"
import { apiClient } from "@/lib/apiClient"
import type { ServerResponse, ServerListResponse, HealthCheckResponse, AdHocCommandResponse } from "@/types/api"

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockServer: ServerResponse = {
  id: "srv-123",
  user_id: "user-abc",
  name: "web-01",
  type: "remote",
  host: "192.168.1.10",
  port: 22,
  credential_id: "cred-123",
  description: null,
  status: "active",
  os_id: "ubuntu",
  os_version: "22.04",
  os_name: "Ubuntu 22.04.3 LTS",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("serversService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("list llama a GET /servers con page y per_page", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      items: [mockServer],
      total: 1,
      page: 1,
      per_page: 10,
    } satisfies ServerListResponse)

    await serversService.list(1, 10)

    expect(apiClient.get).toHaveBeenCalledWith("/servers?page=1&per_page=10")
  })

  it("list usa page=1 y perPage=10 por defecto", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({} as ServerListResponse)

    await serversService.list()

    expect(apiClient.get).toHaveBeenCalledWith("/servers?page=1&per_page=10")
  })

  it("get llama a GET /servers/:id", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockServer)

    await serversService.get("srv-123")

    expect(apiClient.get).toHaveBeenCalledWith("/servers/srv-123")
  })

  it("create llama a POST /servers con el body", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockServer)

    const body = { name: "web-01", type: "remote" as const, host: "192.168.1.10", port: 22 }
    await serversService.create(body)

    expect(apiClient.post).toHaveBeenCalledWith("/servers", body)
  })

  it("update llama a PUT /servers/:id con el body", async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce(mockServer)

    const body = { name: "web-02" }
    await serversService.update("srv-123", body)

    expect(apiClient.put).toHaveBeenCalledWith("/servers/srv-123", body)
  })

  it("delete llama a DELETE /servers/:id", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined)

    await serversService.delete("srv-123")

    expect(apiClient.delete).toHaveBeenCalledWith("/servers/srv-123")
  })

  it("toggle llama a PATCH /servers/:id/toggle", async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(mockServer)

    await serversService.toggle("srv-123")

    expect(apiClient.patch).toHaveBeenCalledWith("/servers/srv-123/toggle")
  })

  it("health llama a GET /servers/:id/health", async () => {
    const mockHealth: HealthCheckResponse = {
      status: "online",
      latency_ms: 45,
      os_id: "ubuntu",
      os_version: "22.04",
      os_name: "Ubuntu 22.04.3 LTS",
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockHealth)

    await serversService.health("srv-123")

    expect(apiClient.get).toHaveBeenCalledWith("/servers/srv-123/health")
  })

  it("exec llama a POST /servers/:id/exec con el body", async () => {
    const mockResult: AdHocCommandResponse = {
      stdout: "total 0",
      stderr: "",
      exit_code: 0,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResult)

    const body = { command: "ls -la", sudo: false, timeout: 30 }
    await serversService.exec("srv-123", body)

    expect(apiClient.post).toHaveBeenCalledWith("/servers/srv-123/exec", body)
  })
})
