// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import CredentialsPage from "@/app/(dashboard)/credentials/page"
import type { CredentialResponse } from "@/types/api"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/features/credentials/components/CredentialsList", () => ({
  CredentialsList: ({
    onEdit,
    onDeleteSuccess,
    page,
    onPageChange,
  }: {
    onEdit: (c: CredentialResponse) => void
    onDeleteSuccess: () => void
    page: number
    onPageChange: (p: number) => void
  }) => (
    <div data-testid="credentials-list">
      <button onClick={() => onPageChange(page + 1)}>Siguiente</button>
      <button
        onClick={() =>
          onEdit({
            credential_id: "cred-1",
            user_id: "user-1",
            name: "test-cred",
            credential_type: "ssh",
            username: "root",
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

vi.mock("@/features/credentials/components/CredentialForm", () => ({
  CredentialForm: ({
    onSuccess,
    onCancel,
    credential,
  }: {
    onSuccess: () => void
    onCancel: () => void
    credential?: CredentialResponse
  }) => (
    <div data-testid="credential-form">
      {credential && <span>Editando: {credential.name}</span>}
      <button onClick={onSuccess}>Guardar mock</button>
      <button onClick={onCancel}>Cancelar mock</button>
    </div>
  ),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CredentialsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza el título y el botón Nueva credencial", () => {
    render(<CredentialsPage />)

    expect(screen.getByText(/credenciales/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /nueva credencial/i })).toBeDefined()
  })

  it("muestra CredentialsList por defecto", () => {
    render(<CredentialsPage />)

    expect(screen.getByTestId("credentials-list")).toBeDefined()
  })

  it("no muestra CredentialForm por defecto", () => {
    render(<CredentialsPage />)

    expect(screen.queryByTestId("credential-form")).toBeNull()
  })

  it("abre el formulario vacío al pulsar Nueva credencial", () => {
    render(<CredentialsPage />)

    fireEvent.click(screen.getByRole("button", { name: /nueva credencial/i }))

    expect(screen.getByTestId("credential-form")).toBeDefined()
    expect(screen.queryByText(/editando:/i)).toBeNull()
  })

  it("abre el formulario con la credencial al pulsar Editar en una fila", () => {
    render(<CredentialsPage />)

    fireEvent.click(screen.getByRole("button", { name: /editar fila/i }))

    expect(screen.getByTestId("credential-form")).toBeDefined()
    expect(screen.getByText(/editando: test-cred/i)).toBeDefined()
  })

  it("cierra el formulario al pulsar Cancelar", () => {
    render(<CredentialsPage />)

    fireEvent.click(screen.getByRole("button", { name: /nueva credencial/i }))
    expect(screen.getByTestId("credential-form")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /cancelar mock/i }))
    expect(screen.queryByTestId("credential-form")).toBeNull()
  })

  it("cierra el formulario y refresca la lista al guardar con éxito", () => {
    render(<CredentialsPage />)

    fireEvent.click(screen.getByRole("button", { name: /nueva credencial/i }))
    fireEvent.click(screen.getByRole("button", { name: /guardar mock/i }))

    expect(screen.queryByTestId("credential-form")).toBeNull()
    // La lista sigue visible tras cerrar el form
    expect(screen.getByTestId("credentials-list")).toBeDefined()
  })
})
