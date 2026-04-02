// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { GroupForm } from "@/features/groups/components/GroupForm"
import * as useCreateGroupModule from "@/features/groups/hooks/useCreateGroup"
import * as useUpdateGroupModule from "@/features/groups/hooks/useUpdateGroup"
import * as useServersModule from "@/features/servers/hooks/useServers"
import type { GroupResponse, ServerResponse } from "@/types/api"

vi.mock("@/features/groups/hooks/useCreateGroup")
vi.mock("@/features/groups/hooks/useUpdateGroup")
vi.mock("@/features/servers/hooks/useServers")

const mockActiveServer: ServerResponse = {
  id: "srv-001",
  user_id: "user-abc",
  name: "web-01",
  type: "remote",
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
  ...mockActiveServer,
  id: "srv-002",
  name: "db-01",
  status: "inactive",
}

const mockGroup: GroupResponse = {
  id: "grp-001",
  user_id: "user-abc",
  name: "Production Cluster",
  description: "Servidores de producción",
  server_ids: ["srv-001"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const defaultCreateHook = { createGroup: vi.fn(), isPending: false, error: null }
const defaultUpdateHook = { updateGroup: vi.fn(), isPending: false, error: null }
const defaultServersHook = {
  servers: [mockActiveServer, mockInactiveServer],
  total: 2,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}

describe("GroupForm", () => {
  const onSuccess = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCreateGroupModule.useCreateGroup).mockReturnValue(defaultCreateHook)
    vi.mocked(useUpdateGroupModule.useUpdateGroup).mockReturnValue(defaultUpdateHook)
    vi.mocked(useServersModule.useServers).mockReturnValue(defaultServersHook)
  })

  // ── Modo creación ────────────────────────────────────────────────────────────

  it("muestra los campos nombre y descripción en modo creación", () => {
    render(<GroupForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByLabelText(/nombre/i)).toBeDefined()
    expect(screen.getByLabelText(/descripción/i)).toBeDefined()
  })

  it("solo muestra servidores activos en el multi-select (RF-43)", () => {
    render(<GroupForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByText("web-01")).toBeDefined()
    expect(screen.queryByText("db-01")).toBeNull()
  })

  it("llama a createGroup con los datos correctos al enviar", async () => {
    render(<GroupForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Mi Grupo" },
    })
    fireEvent.click(screen.getByRole("button", { name: /crear grupo/i }))

    await waitFor(() => {
      expect(defaultCreateHook.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Mi Grupo" }),
        expect.any(Function),
      )
    })
  })

  it("muestra error de validación si el nombre está vacío", async () => {
    render(<GroupForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole("button", { name: /crear grupo/i }))

    await waitFor(() => {
      expect(screen.getByText(/nombre es requerido/i)).toBeDefined()
    })
  })

  it("muestra error de API si createGroup falla", () => {
    vi.mocked(useCreateGroupModule.useCreateGroup).mockReturnValue({
      createGroup: vi.fn(),
      isPending: false,
      error: "No se pudo crear el grupo. Inténtalo de nuevo.",
    })

    render(<GroupForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByRole("alert")).toBeDefined()
  })

  // ── Modo edición ─────────────────────────────────────────────────────────────

  it("rellena los campos con los datos del grupo en modo edición", () => {
    render(<GroupForm group={mockGroup} onSuccess={onSuccess} onCancel={onCancel} />)

    expect((screen.getByLabelText(/nombre/i) as HTMLInputElement).value).toBe("Production Cluster")
    expect((screen.getByLabelText(/descripción/i) as HTMLInputElement).value).toBe("Servidores de producción")
  })

  it("llama a updateGroup con los datos correctos al guardar en modo edición", async () => {
    render(<GroupForm group={mockGroup} onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Nuevo nombre" },
    })
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(defaultUpdateHook.updateGroup).toHaveBeenCalledWith(
        "grp-001",
        expect.objectContaining({ name: "Nuevo nombre" }),
        expect.any(Function),
      )
    })
  })

  it("llama a onCancel al pulsar Cancelar", () => {
    render(<GroupForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
