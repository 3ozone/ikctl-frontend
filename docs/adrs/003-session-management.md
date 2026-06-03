# ADR-003: Gestión de Sesión y Tokens

**Fecha:** 2026-03-09
**Estado:** Aceptado

## Contexto

El backend de ikctl emite:
- `access_token`: JWT, expira en **30 minutos**
- `refresh_token`: JWT, expira en **7 días**, se rota en cada uso

Necesitamos decidir cómo almacenar y renovar estos tokens de forma segura en el cliente.

## Decisión

| Token | Almacenamiento | Razón |
|-------|---------------|-------|
| `access_token` | **Memoria React** (Context) | Desaparece al cerrar pestaña, invisible para JS malicioso |
| `refresh_token` | **HttpOnly Cookie** (servidor) | XSS-proof: JS del cliente no puede leerla |

No usamos **NextAuth.js** por las siguientes razones:

- Añade abstracción innecesaria sobre un backend propio ya controlado
- El backend de ikctl maneja toda la lógica de auth — NextAuth.js duplicaría la lógica de tokens
- Mayor control sobre los flujos de 2FA y GitHub OAuth específicos de ikctl

## Implementación

### Almacenamiento en memoria

```typescript
// src/contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  // ...
}
```

### Refresh silencioso

Un interceptor en la capa de servicio detecta respuestas `401` y llama automáticamente a `POST /auth/refresh` antes de reintentar la request original.

### Middleware de Next.js (edge)

El `middleware.ts` verifica que exista la cookie `refresh_token`. Si no existe, redirige a `/login`. No valida el JWT en el edge (eso lo hace el backend).

## Consecuencias

- Al recargar la página el `access_token` en memoria se pierde → se hace refresh silencioso
- Si el refresh falla → redirect a `/login`
- El `access_token` nunca aparece en localStorage, sessionStorage ni cookies accesibles por JS
- El logout llama al backend (`POST /auth/logout`) para revocar el refresh_token y borra la cookie

## Alternativas descartadas

- **localStorage**: trivialmente accesible por XSS — descartado por RNF-01
- **sessionStorage**: mejor que localStorage pero sigue siendo accesible por JS — descartado
- **NextAuth.js**: añade complejidad innecesaria con un backend propio — descartado
- **Zustand/Redux para tokens**: persist middleware suele escribir en localStorage — descartado
