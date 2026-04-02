// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CredentialsList } from "@/features/credentials/components/CredentialsList"
import * as useCredentialsModule from "@/features/credentials/hooks/useCredentials"
import * as useDeleteCredentialModule from "@/features/credentials/hooks/useDeleteCredential"
import type { CredentialResponse } from "@/types/api"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/features/credentials/hooks/useCredentials")
vi.mock("@/features/credentials/hooks/useDeleteCredential")

const mockCredential: CredentialResponse = {
  credential_id: "cred-123",
  user_id: "user-abc",
  name: "mi-clave-ssh",
  credential_type: "ssh",
  username: "root",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const defaultDeleteHook = {
  deleteCredential: vi.fn(),
  isPending: false,
  error: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CredentialsList", () => {
  const onPageChange = vi.fn()
  const onEdit = vi.fn()
  const onDeleteSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDeleteCredentialModule.useDeleteCredential).mockReturnValue(defaultDeleteHook)
  })

  it("muestra spinner mientras carga", () => {
    vi.mocked(useCredentialsModule.useCredentials).mockReturnValue({
      credentials: [],
      total: 0,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <CredentialsList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )

    expect(screen.getByText(/cargando credenciales/i)).toBeDefined()
  })

  it("muestra estado vacío cuando no hay credenciales", () => {
    vi.mocked(useCredentialsModule.useCredentials).mockReturnValue({
      credentials: [],
      total: 0,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <CredentialsList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )

    expect(screen.getByText(/no tienes credenciales/i)).toBeDefined()
  })

  it("renderiza la tabla con las credenciales", () => {
    vi.mocked(useCredentialsModule.useCredentials).mockReturnValue({
      credentials: [mockCredential],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <CredentialsList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )

    expect(screen.getByText("mi-clave-ssh")).toBeDefined()
    expect(screen.getByText("ssh")).toBeDefined()
    expect(screen.getByText("root")).toBeDefined()
  })

  it("llama a onEdit al pulsar Editar", () => {
    vi.mocked(useCredentialsModule.useCredentials).mockReturnValue({
      credentials: [mockCredential],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <CredentialsList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /editar credencial mi-clave-ssh/i }))

    expect(onEdit).toHaveBeenCalledWith(mockCredential)
  })

  it("llama a deleteCredential al pulsar Eliminar", () => {
    vi.mocked(useCredentialsModule.useCredentials).mockReturnValue({
      credentials: [mockCredential],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <CredentialsList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /eliminar credencial mi-clave-ssh/i }))

    expect(defaultDeleteHook.deleteCredential).toHaveBeenCalledWith(
      "cred-123",
      expect.any(Function),
    )
  })

  it("muestra error de borrado si deleteError tiene valor", () => {
    vi.mocked(useCredentialsModule.useCredentials).mockReturnValue({
      credentials: [mockCredential],
      total: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    vi.mocked(useDeleteCredentialModule.useDeleteCredential).mockReturnValue({
      deleteCredential: vi.fn(),
      isPending: false,
      error: "No se puede eliminar: esta credencial está siendo usada por uno o más servidores.",
    })

    render(
      <CredentialsList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )

    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText(/no se puede eliminar/i)).toBeDefined()
  })

  it("muestra error de carga si error tiene valor", () => {
    vi.mocked(useCredentialsModule.useCredentials).mockReturnValue({
      credentials: [],
      total: 0,
      isLoading: false,
      error: "No se pudieron cargar las credenciales.",
      refetch: vi.fn(),
    })

    render(
      <CredentialsList
        page={1}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )

    expect(screen.getByRole("alert")).toBeDefined()
  })
})
