import { describe, it, expect, vi, beforeEach } from "vitest"
import { credentialsService } from "@/features/credentials/services/credentialsService"
import { apiClient } from "@/lib/apiClient"
import type { CredentialResponse, CredentialListResponse } from "@/types/api"

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockCredential: CredentialResponse = {
  credential_id: "cred-123",
  user_id: "user-abc",
  name: "mi-clave-ssh",
  credential_type: "ssh",
  username: "root",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("credentialsService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("list llama a GET /credentials con page y per_page", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      items: [mockCredential],
      total: 1,
      page: 1,
      per_page: 20,
    } satisfies CredentialListResponse)

    await credentialsService.list(1, 20)

    expect(apiClient.get).toHaveBeenCalledWith("/credentials?page=1&per_page=20")
  })

  it("list usa page=1 y perPage=20 por defecto", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({} as CredentialListResponse)

    await credentialsService.list()

    expect(apiClient.get).toHaveBeenCalledWith("/credentials?page=1&per_page=20")
  })

  it("get llama a GET /credentials/:id", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockCredential)

    await credentialsService.get("cred-123")

    expect(apiClient.get).toHaveBeenCalledWith("/credentials/cred-123")
  })

  it("create llama a POST /credentials con el body", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockCredential)

    const body = { name: "mi-clave", type: "ssh" as const }
    await credentialsService.create(body)

    expect(apiClient.post).toHaveBeenCalledWith("/credentials", body)
  })

  it("update llama a PUT /credentials/:id con el body", async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce(mockCredential)

    const body = { name: "nueva-clave" }
    await credentialsService.update("cred-123", body)

    expect(apiClient.put).toHaveBeenCalledWith("/credentials/cred-123", body)
  })

  it("delete llama a DELETE /credentials/:id", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined)

    await credentialsService.delete("cred-123")

    expect(apiClient.delete).toHaveBeenCalledWith("/credentials/cred-123")
  })
})
