// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ServersPage from "@/app/(dashboard)/servers/page"
import type { ServerResponse } from "@/types/api"

vi.mock("@/features/servers/components/ServersList", () => ({
  ServersList: ({
    onEdit,
    onDeleteSuccess,
    onToggleSuccess,
    page,
    onPageChange,
  }: {
    onEdit: (s: ServerResponse) => void
    onDeleteSuccess: () => void
    onToggleSuccess: () => void
    page: number
    onPageChange: (p: number) => void
  }) => (
    <div data-testid="servers-list">
      <button onClick={() => onPageChange(page + 1)}>Siguiente</button>
      <button
        onClick={() =>
          onEdit({
            id: "srv-001",
            user_id: "user-1",
            name: "web-01",
            type: "remote",
            host: "1.2.3.4",
            port: 22,
            credential_id: null,
            description: null,
            status: "active",
            os_id: null,
            os_version: null,
            os_name: null,
            created_at: "",
            updated_at: "",
          })
        }
      >
        Editar fila
      </button>
      <button onClick={onDeleteSuccess}>Borrar fila</button>
      <button onClick={onToggleSuccess}>Toggle fila</button>
    </div>
  ),
}))

vi.mock("@/features/servers/components/RegisterServerForm", () => ({
  RegisterServerForm: ({
    onSuccess,
    onCancel,
    server,
  }: {
    onSuccess: () => void
    onCancel: () => void
    server?: ServerResponse
  }) => (
    <div data-testid="server-form">
      {server && <span>Editando: {server.name}</span>}
      <button onClick={onSuccess}>Guardar mock</button>
      <button onClick={onCancel}>Cancelar mock</button>
    </div>
  ),
}))

describe("ServersPage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renderiza el título y el botón Nuevo servidor", () => {
    render(<ServersPage />)

    expect(screen.getByText(/servidores/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /nuevo servidor/i })).toBeDefined()
  })

  it("muestra ServersList por defecto", () => {
    render(<ServersPage />)

    expect(screen.getByTestId("servers-list")).toBeDefined()
  })

  it("no muestra RegisterServerForm por defecto", () => {
    render(<ServersPage />)

    expect(screen.queryByTestId("server-form")).toBeNull()
  })

  it("abre el formulario vacío al pulsar Nuevo servidor", () => {
    render(<ServersPage />)

    fireEvent.click(screen.getByRole("button", { name: /nuevo servidor/i }))

    expect(screen.getByTestId("server-form")).toBeDefined()
    expect(screen.queryByText(/editando:/i)).toBeNull()
  })

  it("abre el formulario con el servidor al pulsar Editar en una fila", () => {
    render(<ServersPage />)

    fireEvent.click(screen.getByRole("button", { name: /editar fila/i }))

    expect(screen.getByTestId("server-form")).toBeDefined()
    expect(screen.getByText(/editando: web-01/i)).toBeDefined()
  })

  it("cierra el formulario al pulsar Cancelar", () => {
    render(<ServersPage />)

    fireEvent.click(screen.getByRole("button", { name: /nuevo servidor/i }))
    expect(screen.getByTestId("server-form")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /cancelar mock/i }))
    expect(screen.queryByTestId("server-form")).toBeNull()
  })

  it("cierra el formulario y refresca la lista al guardar con éxito", () => {
    render(<ServersPage />)

    fireEvent.click(screen.getByRole("button", { name: /nuevo servidor/i }))
    fireEvent.click(screen.getByRole("button", { name: /guardar mock/i }))

    expect(screen.queryByTestId("server-form")).toBeNull()
    expect(screen.getByTestId("servers-list")).toBeDefined()
  })
})
