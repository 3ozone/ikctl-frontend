"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { apiClient, ApiError } from "@/lib/apiClient"
import type { AuthTokens, LoginResponse } from "@/types/api"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Access token en memoria — nunca persiste en localStorage */
  accessToken: string | null
  /** Temp token para el flujo 2FA — en memoria, nunca en URL */
  tempToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Intenta login; si requires_2fa=true devuelve temp_token */
  login: (email: string, password: string) => Promise<LoginResponse>
  logout: () => Promise<void>
  /** Refresh silencioso — llama al backend con la cookie HttpOnly */
  silentRefresh: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutos (igual que el backend)
const REFRESH_AHEAD_MS = 60 * 1000 // refrescar 60s antes de expirar

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Programa el próximo refresh proactivo */
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      silentRefresh()
    }, ACCESS_TOKEN_TTL_MS - REFRESH_AHEAD_MS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const silentRefresh = useCallback(async () => {
    try {
      const tokens = await apiClient.post<AuthTokens>("/auth/refresh", {})
      setAccessToken(tokens.access_token)
      scheduleRefresh()
    } catch {
      // refresh falló → sesión expirada, limpiar
      setAccessToken(null)
    }
  }, [scheduleRefresh])

  /** Al montar, intenta recuperar sesión con la cookie HttpOnly existente */
  useEffect(() => {
    silentRefresh().finally(() => setIsLoading(false))
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        email,
        password,
      })
      if (!response.requires_2fa && response.access_token) {
        setAccessToken(response.access_token)
        scheduleRefresh()
      } else if (response.requires_2fa && response.temp_token) {
        // temp_token en memoria del contexto — nunca en URL ni localStorage
        setTempToken(response.temp_token)
      }
      return response
    },
    [scheduleRefresh],
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout", {})
    } catch (err) {
      // si el token ya expiró en el servidor, ignorar el error
      if (!(err instanceof ApiError && err.status === 401)) throw err
    } finally {
      setAccessToken(null)
      setTempToken(null)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        tempToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        logout,
        silentRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>")
  }
  return ctx
}
