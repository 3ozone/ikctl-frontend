// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import GroupsPage from "@/app/(dashboard)/groups/page"
import type { GroupResponse } from "@/types/api"

vi.mock("@/features/groups/components/GroupsList", () => ({
  GroupsList: ({
    onEdit,
    onDeleteSuccess,
    page,
    onPageChange,
  }: {
    onEdit: (g: GroupResponse) => void
    onDeleteSuccess: () => void
    page: number
    onPageChange: (p: number) => void
  }) => (
    <div data-testid="groups-list">
      <button onClick={() => onPageChange(page + 1)}>Siguiente</button>
      <button
        onClick={() =>
          onEdit({
            id: "grp-001",
            user_id: "user-1",
            name: "Production Cluster",
            description: null,
            server_ids: [],
            created_at: "",
            updated_at: "",
          })
        }
      >
        Editar fila
      </button>
      <button onClick={onDeleteSuccess}>Borrar fila</button>
    </div>
  ),
}))

vi.mock("@/features/groups/components/GroupForm", () => ({
  GroupForm: ({
    onSuccess,
    onCancel,
    group,
  }: {
    onSuccess: () => void
    onCancel: () => void
    group?: GroupResponse
  }) => (
    <div data-testid="group-form">
      {group && <span>Editando: {group.name}</span>}
      <button onClick={onSuccess}>Guardar mock</button>
      <button onClick={onCancel}>Cancelar mock</button>
    </div>
  ),
}))

describe("GroupsPage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renderiza el título y el botón Nuevo grupo", () => {
    render(<GroupsPage />)

    expect(screen.getByText(/grupos/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /nuevo grupo/i })).toBeDefined()
  })

  it("muestra GroupsList por defecto", () => {
    render(<GroupsPage />)

    expect(screen.getByTestId("groups-list")).toBeDefined()
  })

  it("no muestra GroupForm por defecto", () => {
    render(<GroupsPage />)

    expect(screen.queryByTestId("group-form")).toBeNull()
  })

  it("abre el formulario vacío al pulsar Nuevo grupo", () => {
    render(<GroupsPage />)

    fireEvent.click(screen.getByRole("button", { name: /nuevo grupo/i }))

    expect(screen.getByTestId("group-form")).toBeDefined()
    expect(screen.queryByText(/editando:/i)).toBeNull()
  })

  it("abre el formulario con el grupo al pulsar Editar en una fila", () => {
    render(<GroupsPage />)

    fireEvent.click(screen.getByRole("button", { name: /editar fila/i }))

    expect(screen.getByTestId("group-form")).toBeDefined()
    expect(screen.getByText(/editando: Production Cluster/i)).toBeDefined()
  })

  it("cierra el formulario al pulsar Cancelar", () => {
    render(<GroupsPage />)

    fireEvent.click(screen.getByRole("button", { name: /nuevo grupo/i }))
    expect(screen.getByTestId("group-form")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /cancelar mock/i }))
    expect(screen.queryByTestId("group-form")).toBeNull()
  })

  it("cierra el formulario y refresca la lista al guardar con éxito", () => {
    render(<GroupsPage />)

    fireEvent.click(screen.getByRole("button", { name: /nuevo grupo/i }))
    fireEvent.click(screen.getByRole("button", { name: /guardar mock/i }))

    expect(screen.queryByTestId("group-form")).toBeNull()
    expect(screen.getByTestId("groups-list")).toBeDefined()
  })
})
