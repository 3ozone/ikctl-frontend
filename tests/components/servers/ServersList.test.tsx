// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ServersList } from "@/features/servers/components/ServersList"
import * as useServersModule from "@/features/servers/hooks/useServers"
import * as useDeleteServerModule from "@/features/servers/hooks/useDeleteServer"
import * as useToggleServerModule from "@/features/servers/hooks/useToggleServer"
import type { ServerResponse } from "@/types/api"

vi.mock("@/features/servers/hooks/useServers")
vi.mock("@/features/servers/hooks/useDeleteServer")
vi.mock("@/features/servers/hooks/useToggleServer")

const mockRemoteServer: ServerResponse = {
  server_id: "srv-001",
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

const mockInactiveServer: ServerResponse = {
  ...mockRemoteServer,
  server_id: "srv-002",
  name: "db-01",
  status: "inactive",
}

const mockLocalServer: ServerResponse = {
  ...mockRemoteServer,
  server_id: "srv-003",
  name: "localhost",
  server_type: "local",
  host: null as unknown as string,
}

const defaultDeleteHook = { deleteServer: vi.fn(), isPending: false, error: null }
const defaultToggleHook = { toggleServer: vi.fn(), isPending: false, error: null }

describe("ServersList", () => {
  const onPageChange = vi.fn()
  const onEdit = vi.fn()
  const onDeleteSuccess = vi.fn()
  const onToggleSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDeleteServerModule.useDeleteServer).mockReturnValue(defaultDeleteHook)
    vi.mocked(useToggleServerModule.useToggleServer).mockReturnValue(defaultToggleHook)
  })

  it("muestra spinner mientras carga", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [],
      total: 0,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    expect(screen.getByText(/cargando servidores/i)).toBeDefined()
  })

  it("muestra estado vacío cuando no hay servidores", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [],
      total: 0,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    expect(screen.getByText(/no tienes servidores/i)).toBeDefined()
  })

  it("renderiza la tabla con nombre, tipo y estado del servidor", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [mockRemoteServer],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    expect(screen.getByText("web-01")).toBeDefined()
    expect(screen.getByText("remote")).toBeDefined()
    expect(screen.getByText("active")).toBeDefined()
    expect(screen.getByText("192.168.1.10")).toBeDefined()
  })

  it("diferencia visualmente los servidores inactivos (RF-38)", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [mockInactiveServer],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    expect(screen.getByText("inactive")).toBeDefined()
    const row = screen.getByRole("row", { name: /db-01/i })
    expect(row.className).toMatch(/opacity|muted|inactive/i)
  })

  it("muestra el tipo 'local' correctamente", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [mockLocalServer],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    expect(screen.getByText("local")).toBeDefined()
    expect(screen.getByText("—")).toBeDefined()
  })

  it("llama a onEdit al pulsar Editar", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [mockRemoteServer],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /editar servidor web-01/i }))
    expect(onEdit).toHaveBeenCalledWith(mockRemoteServer)
  })

  it("llama a deleteServer al pulsar Eliminar", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [mockRemoteServer],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /eliminar servidor web-01/i }))
    expect(defaultDeleteHook.deleteServer).toHaveBeenCalledWith("srv-001", expect.any(Function))
  })

  it("llama a toggleServer al pulsar el botón de toggle", () => {
    vi.mocked(useServersModule.useServers).mockReturnValue({
      servers: [mockRemoteServer],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ServersList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
        onToggleSuccess={onToggleSuccess}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /deshabilitar servidor web-01/i }))
    expect(defaultToggleHook.toggleServer).toHaveBeenCalledWith("srv-001", expect.any(Function))
  })
})
