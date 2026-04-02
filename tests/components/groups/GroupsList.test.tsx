// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GroupsList } from "@/features/groups/components/GroupsList"
import * as useGroupsModule from "@/features/groups/hooks/useGroups"
import * as useDeleteGroupModule from "@/features/groups/hooks/useDeleteGroup"
import type { GroupResponse } from "@/types/api"

vi.mock("@/features/groups/hooks/useGroups")
vi.mock("@/features/groups/hooks/useDeleteGroup")

const mockGroup: GroupResponse = {
  id: "grp-001",
  user_id: "user-abc",
  name: "Production Cluster",
  description: "Servidores de producción",
  server_ids: ["srv-001", "srv-002"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockGroupNoDesc: GroupResponse = {
  ...mockGroup,
  id: "grp-002",
  name: "Staging",
  description: null,
  server_ids: [],
}

const defaultDeleteHook = { deleteGroup: vi.fn(), isPending: false, error: null }

describe("GroupsList", () => {
  const onPageChange = vi.fn()
  const onEdit = vi.fn()
  const onDeleteSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDeleteGroupModule.useDeleteGroup).mockReturnValue(defaultDeleteHook)
  })

  it("muestra spinner mientras carga", () => {
    vi.mocked(useGroupsModule.useGroups).mockReturnValue({
      groups: [],
      total: 0,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GroupsList page={1} onPageChange={onPageChange} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
    )

    expect(screen.getByText(/cargando grupos/i)).toBeDefined()
  })

  it("muestra estado vacío cuando no hay grupos", () => {
    vi.mocked(useGroupsModule.useGroups).mockReturnValue({
      groups: [],
      total: 0,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GroupsList page={1} onPageChange={onPageChange} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
    )

    expect(screen.getByText(/no tienes grupos/i)).toBeDefined()
  })

  it("renderiza la tabla con nombre, descripción y número de servidores", () => {
    vi.mocked(useGroupsModule.useGroups).mockReturnValue({
      groups: [mockGroup],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GroupsList page={1} onPageChange={onPageChange} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
    )

    expect(screen.getByText("Production Cluster")).toBeDefined()
    expect(screen.getByText("Servidores de producción")).toBeDefined()
    expect(screen.getByText("2")).toBeDefined()
  })

  it("muestra guión cuando el grupo no tiene descripción", () => {
    vi.mocked(useGroupsModule.useGroups).mockReturnValue({
      groups: [mockGroupNoDesc],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GroupsList page={1} onPageChange={onPageChange} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
    )

    expect(screen.getByText("—")).toBeDefined()
  })

  it("llama a onEdit con el grupo al pulsar Editar", () => {
    vi.mocked(useGroupsModule.useGroups).mockReturnValue({
      groups: [mockGroup],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GroupsList page={1} onPageChange={onPageChange} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
    )

    fireEvent.click(screen.getByRole("button", { name: /editar/i }))
    expect(onEdit).toHaveBeenCalledWith(mockGroup)
  })

  it("llama a deleteGroup al pulsar Eliminar", () => {
    const deleteGroup = vi.fn()
    vi.mocked(useDeleteGroupModule.useDeleteGroup).mockReturnValue({
      deleteGroup,
      isPending: false,
      error: null,
    })
    vi.mocked(useGroupsModule.useGroups).mockReturnValue({
      groups: [mockGroup],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GroupsList page={1} onPageChange={onPageChange} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
    )

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }))
    expect(deleteGroup).toHaveBeenCalledWith("grp-001", expect.any(Function))
  })

  it("muestra error de delete si hay uno", () => {
    vi.mocked(useDeleteGroupModule.useDeleteGroup).mockReturnValue({
      deleteGroup: vi.fn(),
      isPending: false,
      error: "No se puede eliminar: este grupo está vinculado a uno o más pipelines.",
    })
    vi.mocked(useGroupsModule.useGroups).mockReturnValue({
      groups: [mockGroup],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GroupsList page={1} onPageChange={onPageChange} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
    )

    expect(screen.getByRole("alert")).toBeDefined()
  })
})
