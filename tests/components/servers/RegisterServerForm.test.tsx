// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RegisterServerForm } from "@/features/servers/components/RegisterServerForm"
import * as useCreateServerModule from "@/features/servers/hooks/useCreateServer"
import * as useUpdateServerModule from "@/features/servers/hooks/useUpdateServer"
import type { ServerResponse } from "@/types/api"

vi.mock("@/features/servers/hooks/useCreateServer")
vi.mock("@/features/servers/hooks/useUpdateServer")

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

const mockLocalServer: ServerResponse = {
  ...mockRemoteServer,
  server_id: "srv-002",
  name: "mi-local",
  server_type: "local",
  host: null as unknown as string,
}

const defaultCreateHook = { createServer: vi.fn(), isPending: false, error: null }
const defaultUpdateHook = { updateServer: vi.fn(), isPending: false, error: null }

describe("RegisterServerForm", () => {
  const onSuccess = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCreateServerModule.useCreateServer).mockReturnValue(defaultCreateHook)
    vi.mocked(useUpdateServerModule.useUpdateServer).mockReturnValue(defaultUpdateHook)
  })

  // ── Modo creación ────────────────────────────────────────────────────────────

  it("muestra el selector de tipo en modo creación", () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByLabelText(/tipo de servidor/i)).toBeDefined()
  })

  it("muestra campos host y puerto cuando el tipo es 'remote'", () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByLabelText(/host/i)).toBeDefined()
    expect(screen.getByLabelText(/puerto/i)).toBeDefined()
  })

  it("oculta host y puerto cuando el tipo es 'local'", async () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/tipo de servidor/i), {
      target: { value: "local" },
    })

    await waitFor(() => {
      expect(screen.queryByLabelText(/host/i)).toBeNull()
      expect(screen.queryByLabelText(/puerto/i)).toBeNull()
    })
  })

  it("llama a createServer con type 'remote' al enviar el formulario", async () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "web-01" } })
    fireEvent.change(screen.getByLabelText(/host/i), { target: { value: "1.2.3.4" } })
    fireEvent.click(screen.getByRole("button", { name: /crear servidor/i }))

    await waitFor(() => {
      expect(defaultCreateHook.createServer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "web-01", type: "remote", host: "1.2.3.4" }),
        expect.any(Function),
      )
    })
  })

  it("llama a createServer con type 'local' al enviar el formulario", async () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/tipo de servidor/i), {
      target: { value: "local" },
    })
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "mi-local" } })
    fireEvent.click(screen.getByRole("button", { name: /crear servidor/i }))

    await waitFor(() => {
      expect(defaultCreateHook.createServer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "mi-local", type: "local" }),
        expect.any(Function),
      )
    })
  })

  it("muestra error de validación si el nombre está vacío", async () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole("button", { name: /crear servidor/i }))

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeDefined()
    })
  })

  it("muestra error de validación si el host está vacío en tipo 'remote'", async () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "web-01" } })
    fireEvent.click(screen.getByRole("button", { name: /crear servidor/i }))

    await waitFor(() => {
      expect(screen.getByText(/el host es requerido/i)).toBeDefined()
    })
  })

  // ── Modo edición ─────────────────────────────────────────────────────────────

  it("rellena los campos con los datos del servidor en modo edición", () => {
    render(
      <RegisterServerForm server={mockRemoteServer} onSuccess={onSuccess} onCancel={onCancel} />,
    )

    expect((screen.getByLabelText(/nombre/i) as HTMLInputElement).value).toBe("web-01")
    expect((screen.getByLabelText(/host/i) as HTMLInputElement).value).toBe("192.168.1.10")
  })

  it("oculta el selector de tipo en modo edición", () => {
    render(
      <RegisterServerForm server={mockRemoteServer} onSuccess={onSuccess} onCancel={onCancel} />,
    )

    expect(screen.queryByLabelText(/tipo de servidor/i)).toBeNull()
  })

  it("llama a updateServer al enviar en modo edición", async () => {
    render(
      <RegisterServerForm server={mockRemoteServer} onSuccess={onSuccess} onCancel={onCancel} />,
    )

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "web-02" } })
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(defaultUpdateHook.updateServer).toHaveBeenCalledWith(
        "srv-001",
        expect.objectContaining({ name: "web-02" }),
        expect.any(Function),
      )
    })
  })

  it("llama a onCancel al pulsar el botón Cancelar", () => {
    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("muestra el error del hook si createServer falla", () => {
    vi.mocked(useCreateServerModule.useCreateServer).mockReturnValue({
      createServer: vi.fn(),
      isPending: false,
      error: "Ya existe un servidor con ese nombre.",
    })

    render(<RegisterServerForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText(/ya existe un servidor con ese nombre/i)).toBeDefined()
  })

  it("oculta host y puerto al editar un servidor local", () => {
    render(
      <RegisterServerForm server={mockLocalServer} onSuccess={onSuccess} onCancel={onCancel} />,
    )

    expect(screen.queryByLabelText(/host/i)).toBeNull()
    expect(screen.queryByLabelText(/puerto/i)).toBeNull()
  })
})
