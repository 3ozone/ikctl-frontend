// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import ServerDetailPage from "@/app/(dashboard)/servers/[id]/page"
import * as useServerModule from "@/features/servers/hooks/useServer"
import type { ServerResponse } from "@/types/api"

vi.mock("@/features/servers/hooks/useServer")
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}))
vi.mock("@/features/servers/components/ServerHealthCard", () => ({
  ServerHealthCard: ({ serverId }: { serverId: string }) => (
    <div data-testid="health-card" data-serverid={serverId} />
  ),
}))
vi.mock("@/features/servers/components/AdHocCommandPanel", () => ({
  AdHocCommandPanel: ({ serverId }: { serverId: string }) => (
    <div data-testid="adhoc-panel" data-serverid={serverId} />
  ),
}))

const mockServer: ServerResponse = {
  id: "srv-001",
  user_id: "user-abc",
  name: "web-01",
  type: "remote",
  host: "192.168.1.10",
  port: 22,
  credential_id: null,
  description: "Servidor principal",
  status: "active",
  os_id: "ubuntu",
  os_version: "22.04",
  os_name: "Ubuntu 22.04 LTS",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("ServerDetailPage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("muestra spinner mientras carga", () => {
    vi.mocked(useServerModule.useServer).mockReturnValue({
      server: null,
      isLoading: true,
      error: null,
    })

    render(<ServerDetailPage params={{ id: "srv-001" }} />)

    expect(screen.getByText(/cargando/i)).toBeDefined()
  })

  it("muestra error si el servidor no se encuentra", () => {
    vi.mocked(useServerModule.useServer).mockReturnValue({
      server: null,
      isLoading: false,
      error: "Servidor no encontrado.",
    })

    render(<ServerDetailPage params={{ id: "srv-001" }} />)

    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText(/servidor no encontrado/i)).toBeDefined()
  })

  it("muestra el nombre y datos del servidor", () => {
    vi.mocked(useServerModule.useServer).mockReturnValue({
      server: mockServer,
      isLoading: false,
      error: null,
    })

    render(<ServerDetailPage params={{ id: "srv-001" }} />)

    expect(screen.getByText("web-01")).toBeDefined()
    expect(screen.getByText("192.168.1.10")).toBeDefined()
    expect(screen.getByText("Servidor principal")).toBeDefined()
  })

  it("renderiza ServerHealthCard con el id correcto", () => {
    vi.mocked(useServerModule.useServer).mockReturnValue({
      server: mockServer,
      isLoading: false,
      error: null,
    })

    render(<ServerDetailPage params={{ id: "srv-001" }} />)

    const card = screen.getByTestId("health-card")
    expect(card.getAttribute("data-serverid")).toBe("srv-001")
  })

  it("renderiza AdHocCommandPanel con el id correcto", () => {
    vi.mocked(useServerModule.useServer).mockReturnValue({
      server: mockServer,
      isLoading: false,
      error: null,
    })

    render(<ServerDetailPage params={{ id: "srv-001" }} />)

    const panel = screen.getByTestId("adhoc-panel")
    expect(panel.getAttribute("data-serverid")).toBe("srv-001")
  })

  it("muestra enlace de vuelta a la lista de servidores", () => {
    vi.mocked(useServerModule.useServer).mockReturnValue({
      server: mockServer,
      isLoading: false,
      error: null,
    })

    render(<ServerDetailPage params={{ id: "srv-001" }} />)

    expect(screen.getByRole("link", { name: /volver/i })).toBeDefined()
  })
})
