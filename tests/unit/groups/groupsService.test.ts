import { describe, it, expect, vi, beforeEach } from "vitest"
import { groupsService } from "@/features/groups/services/groupsService"
import { apiClient } from "@/lib/apiClient"
import type { GroupResponse, GroupListResponse } from "@/types/api"

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGroup: GroupResponse = {
  group_id: "grp-123",
  user_id: "user-abc",
  name: "Production Cluster",
  description: "Servidores de producción",
  server_ids: ["srv-001", "srv-002"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("groupsService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("list llama a GET /groups con page y per_page", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      items: [mockGroup],
      total: 1,
      page: 1,
      per_page: 10,
    } satisfies GroupListResponse)

    await groupsService.list(1, 10)

    expect(apiClient.get).toHaveBeenCalledWith("/groups?page=1&per_page=10")
  })

  it("list usa page=1 y perPage=10 por defecto", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({} as GroupListResponse)

    await groupsService.list()

    expect(apiClient.get).toHaveBeenCalledWith("/groups?page=1&per_page=10")
  })

  it("get llama a GET /groups/:id", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockGroup)

    await groupsService.get("grp-123")

    expect(apiClient.get).toHaveBeenCalledWith("/groups/grp-123")
  })

  it("create llama a POST /groups con el body", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockGroup)

    const body = { name: "Production Cluster", server_ids: ["srv-001"] }
    await groupsService.create(body)

    expect(apiClient.post).toHaveBeenCalledWith("/groups", body)
  })

  it("update llama a PUT /groups/:id con el body", async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce(mockGroup)

    const body = { name: "Nuevo nombre" }
    await groupsService.update("grp-123", body)

    expect(apiClient.put).toHaveBeenCalledWith("/groups/grp-123", body)
  })

  it("delete llama a DELETE /groups/:id", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined)

    await groupsService.delete("grp-123")

    expect(apiClient.delete).toHaveBeenCalledWith("/groups/grp-123")
  })
})
