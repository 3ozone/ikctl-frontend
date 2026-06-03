// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ServerHealthCard } from "@/features/servers/components/ServerHealthCard"
import * as useServerHealthModule from "@/features/servers/hooks/useServerHealth"
import type { HealthCheckResponse } from "@/types/api"

vi.mock("@/features/servers/hooks/useServerHealth")

const mockHealth: HealthCheckResponse = {
  status: "online",
  latency_ms: 12,
  os_id: "ubuntu",
  os_version: "22.04",
  os_name: "Ubuntu 22.04 LTS",
}

const defaultHook = { checkHealth: vi.fn(), health: null, isPending: false, error: null }

describe("ServerHealthCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useServerHealthModule.useServerHealth).mockReturnValue(defaultHook)
  })

  it("muestra el botón 'Comprobar' en estado inicial", () => {
    render(<ServerHealthCard serverId="srv-001" />)

    expect(screen.getByRole("button", { name: /comprobar/i })).toBeDefined()
    expect(screen.queryByText(/online|offline/i)).toBeNull()
  })

  it("muestra spinner mientras está cargando", () => {
    vi.mocked(useServerHealthModule.useServerHealth).mockReturnValue({
      ...defaultHook,
      isPending: true,
    })

    render(<ServerHealthCard serverId="srv-001" />)

    expect(screen.getByRole("button", { name: /comprobando/i })).toBeDefined()
  })

  it("muestra el resultado del health check cuando está disponible", () => {
    vi.mocked(useServerHealthModule.useServerHealth).mockReturnValue({
      ...defaultHook,
      health: mockHealth,
    })

    render(<ServerHealthCard serverId="srv-001" />)

    expect(screen.getByText(/online/i)).toBeDefined()
    expect(screen.getByText(/12/)).toBeDefined()
    expect(screen.getByText(/Ubuntu 22.04 LTS/i)).toBeDefined()
  })

  it("muestra el estado 'offline' con estilo diferenciado", () => {
    vi.mocked(useServerHealthModule.useServerHealth).mockReturnValue({
      ...defaultHook,
      health: { ...mockHealth, status: "offline", latency_ms: null as unknown as number },
    })

    render(<ServerHealthCard serverId="srv-001" />)

    expect(screen.getByText(/offline/i)).toBeDefined()
  })

  it("muestra error si el health check falla", () => {
    vi.mocked(useServerHealthModule.useServerHealth).mockReturnValue({
      ...defaultHook,
      error: "Servidor no encontrado.",
    })

    render(<ServerHealthCard serverId="srv-001" />)

    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText(/servidor no encontrado/i)).toBeDefined()
  })

  it("llama a checkHealth al pulsar el botón Comprobar", () => {
    render(<ServerHealthCard serverId="srv-001" />)

    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }))
    expect(defaultHook.checkHealth).toHaveBeenCalledWith("srv-001")
  })
})
