// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CredentialForm } from "@/features/credentials/components/CredentialForm"
import * as useCreateCredentialModule from "@/features/credentials/hooks/useCreateCredential"
import * as useUpdateCredentialModule from "@/features/credentials/hooks/useUpdateCredential"
import type { CredentialResponse } from "@/types/api"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/features/credentials/hooks/useCreateCredential")
vi.mock("@/features/credentials/hooks/useUpdateCredential")

const mockCreateHook = {
  createCredential: vi.fn(),
  isPending: false,
  error: null,
}

const mockUpdateHook = {
  updateCredential: vi.fn(),
  isPending: false,
  error: null,
}

const existingCredential: CredentialResponse = {
  credential_id: "cred-123",
  user_id: "user-abc",
  name: "mi-clave-ssh",
  credential_type: "ssh",
  username: "root",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CredentialForm", () => {
  const onSuccess = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCreateCredentialModule.useCreateCredential).mockReturnValue(mockCreateHook)
    vi.mocked(useUpdateCredentialModule.useUpdateCredential).mockReturnValue(mockUpdateHook)
  })

  // ── Modo creación ────────────────────────────────────────────────────────────

  it("renderiza el formulario en modo creación con campo nombre y selector de tipo", () => {
    render(<CredentialForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByLabelText(/nombre/i)).toBeDefined()
    expect(screen.getByLabelText(/tipo/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDefined()
  })

  it("el tipo ssh muestra campos de usuario, contraseña y clave privada", () => {
    render(<CredentialForm onSuccess={onSuccess} onCancel={onCancel} />)

    // ssh es el valor por defecto y muestra sus campos específicos
    expect(screen.getByLabelText(/usuario/i)).toBeDefined()
    expect(screen.getByLabelText(/^contraseña$/i)).toBeDefined()
    expect(screen.getByLabelText(/clave privada/i)).toBeDefined()
  })

  it("al seleccionar git_https muestra username y password", async () => {
    render(<CredentialForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/tipo/i), { target: { value: "git_https" } })

    await waitFor(() => {
      expect(screen.getByLabelText(/usuario/i)).toBeDefined()
      expect(screen.getByLabelText(/contraseña/i)).toBeDefined()
    })
  })

  it("al seleccionar git_ssh muestra campo clave privada", async () => {
    render(<CredentialForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/tipo/i), { target: { value: "git_ssh" } })

    await waitFor(() => {
      expect(screen.getByLabelText(/clave privada/i)).toBeDefined()
    })
  })

  it("llama a createCredential al enviar el formulario con datos válidos (ssh)", async () => {
    render(<CredentialForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "nueva-clave" } })
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "admin" } })
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: "s3cr3t" } })
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(mockCreateHook.createCredential).toHaveBeenCalledWith(
        expect.objectContaining({ name: "nueva-clave", type: "ssh" }),
        expect.any(Function),
      )
    })
  })

  it("llama a onCancel al pulsar Cancelar", () => {
    render(<CredentialForm onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("muestra error del hook si createCredential falla", () => {
    vi.mocked(useCreateCredentialModule.useCreateCredential).mockReturnValue({
      ...mockCreateHook,
      error: "Ya existe una credencial con ese nombre.",
    })

    render(<CredentialForm onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText(/ya existe una credencial/i)).toBeDefined()
  })

  // ── Modo edición ─────────────────────────────────────────────────────────────

  it("en modo edición no muestra el selector de tipo", () => {
    render(
      <CredentialForm
        credential={existingCredential}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
    )

    expect(screen.queryByLabelText(/tipo/i)).toBeNull()
  })

  it("en modo edición rellena el campo nombre con el valor existente", () => {
    render(
      <CredentialForm
        credential={existingCredential}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
    )

    const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement
    expect(nameInput.value).toBe("mi-clave-ssh")
  })

  it("en modo edición llama a updateCredential al guardar", async () => {
    render(
      <CredentialForm
        credential={existingCredential}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(mockUpdateHook.updateCredential).toHaveBeenCalledWith(
        "cred-123",
        expect.objectContaining({ name: "mi-clave-ssh" }),
        expect.any(Function),
      )
    })
  })

  it("muestra error del hook si updateCredential falla", () => {
    vi.mocked(useUpdateCredentialModule.useUpdateCredential).mockReturnValue({
      ...mockUpdateHook,
      error: "Credencial no encontrada.",
    })

    render(
      <CredentialForm
        credential={existingCredential}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText(/credencial no encontrada/i)).toBeDefined()
  })
})
