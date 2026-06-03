import type { ApiErrorBody } from "@/types/api"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

// ─── Token storage (módulo-nivel, nunca persiste en disco) ────────────────────

let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(`API Error ${status}`)
    this.name = "ApiError"
  }

  /** Devuelve el primer mensaje de error, sea string o validación. */
  get message(): string {
    if (typeof this.body.detail === "string") return this.body.detail
    if (Array.isArray(this.body.detail) && this.body.detail.length > 0) {
      return this.body.detail[0].msg
    }
    return `Error ${this.status}`
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: optionHeaders, ...restOptions } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", // siempre — para enviar/recibir cookies HttpOnly
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
      ...optionHeaders,
    },
  })

  if (!response.ok) {
    let body: ApiErrorBody = { detail: `Error ${response.status}` }
    try {
      body = await response.json()
    } catch {
      // si el body no es JSON, usamos el mensaje genérico
    }
    throw new ApiError(response.status, body)
  }

  // 204 No Content — devolver undefined
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, headers?: HeadersInit) =>
    request<T>(path, { method: "GET", headers }),

  post: <T>(path: string, body: unknown, headers?: HeadersInit) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    }),

  put: <T>(path: string, body: unknown, headers?: HeadersInit) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      headers,
    }),

  patch: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  delete: <T>(path: string, headers?: HeadersInit) =>
    request<T>(path, { method: "DELETE", headers }),
}
