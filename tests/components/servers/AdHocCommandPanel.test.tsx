// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AdHocCommandPanel } from "@/features/servers/components/AdHocCommandPanel"
import * as useAdHocCommandModule from "@/features/servers/hooks/useAdHocCommand"

vi.mock("@/features/servers/hooks/useAdHocCommand")

const defaultHook = {
  execCommand: vi.fn(),
  commandResult: null,
  isPending: false,
  error: null,
}

describe("AdHocCommandPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAdHocCommandModule.useAdHocCommand).mockReturnValue(defaultHook)
  })

  it("muestra el campo de comando y el botón Ejecutar", () => {
    render(<AdHocCommandPanel serverId="srv-001" />)

    expect(screen.getByLabelText(/comando/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /ejecutar/i })).toBeDefined()
  })

  it("muestra el checkbox de sudo", () => {
    render(<AdHocCommandPanel serverId="srv-001" />)

    expect(screen.getByRole("checkbox", { name: /sudo/i })).toBeDefined()
  })

  it("llama a execCommand con los valores del formulario al enviar", async () => {
    render(<AdHocCommandPanel serverId="srv-001" />)

    fireEvent.change(screen.getByLabelText(/comando/i), {
      target: { value: "ls -la" },
    })
    fireEvent.click(screen.getByRole("button", { name: /ejecutar/i }))

    await waitFor(() => {
      expect(defaultHook.execCommand).toHaveBeenCalledWith(
        "srv-001",
        expect.objectContaining({ command: "ls -la", sudo: false }),
      )
    })
  })

  it("muestra validación si el comando está vacío", async () => {
    render(<AdHocCommandPanel serverId="srv-001" />)

    fireEvent.click(screen.getByRole("button", { name: /ejecutar/i }))

    await waitFor(() => {
      expect(screen.getByText(/el comando es requerido/i)).toBeDefined()
    })
  })

  it("muestra spinner en el botón mientras está pendiente", () => {
    vi.mocked(useAdHocCommandModule.useAdHocCommand).mockReturnValue({
      ...defaultHook,
      isPending: true,
    })

    render(<AdHocCommandPanel serverId="srv-001" />)

    expect(screen.getByRole("button", { name: /ejecutando/i })).toBeDefined()
  })

  it("muestra el resultado en un elemento <pre> cuando hay respuesta (RNF-18)", () => {
    vi.mocked(useAdHocCommandModule.useAdHocCommand).mockReturnValue({
      ...defaultHook,
      commandResult: { stdout: "hello world\n", stderr: "", exit_code: 0 },
    })

    render(<AdHocCommandPanel serverId="srv-001" />)

    const pre = screen.getByRole("region", { name: /salida/i })
    expect(pre).toBeDefined()
    expect(pre.textContent).toContain("hello world")
  })

  it("muestra stderr si el comando produce errores", () => {
    vi.mocked(useAdHocCommandModule.useAdHocCommand).mockReturnValue({
      ...defaultHook,
      commandResult: { stdout: "", stderr: "permission denied\n", exit_code: 1 },
    })

    render(<AdHocCommandPanel serverId="srv-001" />)

    expect(screen.getByText(/permission denied/i)).toBeDefined()
  })

  it("muestra error del hook si execCommand falla", () => {
    vi.mocked(useAdHocCommandModule.useAdHocCommand).mockReturnValue({
      ...defaultHook,
      error: "Servidor no encontrado.",
    })

    render(<AdHocCommandPanel serverId="srv-001" />)

    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText(/servidor no encontrado/i)).toBeDefined()
  })
})
