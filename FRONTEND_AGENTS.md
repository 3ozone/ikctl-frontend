# FRONTEND_AGENTS.md - Guía de Desarrollo para ikctl-frontend

## ⚠️ PROCESO OBLIGATORIO - NUNCA SALTARSE

Igual que en el backend (`AGENTS.md`), cada cambio se hace **UNO POR UNO** con aprobación entre pasos.

### Flujo Estricto para Cada Tarea

1. **Crear SCHEMA Zod** → ⛔ **PARAR** → Explicar schema creado → Pedir permiso
2. **Crear TIPOS TypeScript** (si necesarios) → ⛔ **PARAR** → Explicar → Pedir permiso
3. **Crear SERVICIO** (llamada API) → ⛔ **PARAR** → Explicar → Pedir permiso
4. **Crear HOOK** → ⛔ **PARAR** → Explicar → Pedir permiso
5. **Crear COMPONENTE / PÁGINA** → ⛔ **PARAR** → Explicar → Pedir permiso
6. **Ejecutar TESTS / Lint** → ⛔ **PARAR** → Mostrar resultado → Pedir permiso para siguiente tarea

### ❌ PROHIBIDO

- Crear schema + servicio + componente en un mismo turno sin aprobación
- Importar `fetch` directamente en componentes — siempre usar `apiClient`
- Almacenar tokens en `localStorage` o `sessionStorage`
- Usar `any` en TypeScript — TypeScript estricto obligatorio
- Continuar a la siguiente tarea sin confirmación explícita del usuario

---

## 🧭 Filosofía de Desarrollo

Seguimos los mismos principios que el backend, adaptados al mundo React/Next.js:

- **Separación de capas**: rutas → componentes → hooks → servicios → apiClient
- **TypeScript estricto**: `strict: true` en `tsconfig.json`, sin `any`, sin `as` innecesarios
- **Schemas como fuente de verdad**: Zod define los tipos — se derivan con `z.infer<>`
- **Accesibilidad primero**: ARIA, keyboard navigation, contraste WCAG AA
- **Seguridad por diseño**: tokens en memoria, cookies HttpOnly, CSP headers
- **YAGNI**: no implementar lo que no está en los requisitos todavía

---

## 🏛️ Arquitectura

### Capas y Responsabilidades

```bash
app/ (Next.js routing)
  └── Solo layout.tsx y page.tsx — thin wrappers, sin lógica

features/<feature>/
  ├── components/    → Componentes React específicos del feature
  ├── hooks/         → Lógica de estado y efectos (llaman a servicios)
  ├── services/      → Funciones que llaman a la API (puras, testeables)
  ├── schemas/       → Schemas Zod (validación + tipos)
  └── types.ts       → Tipos TypeScript del feature

components/ui/       → shadcn/ui (copiados, customizables)
contexts/            → Contextos React globales (AuthContext)
lib/
  ├── apiClient.ts   → Instancia fetch configurada (base URL, interceptores)
  └── utils.ts       → Funciones de utilidad puras
types/               → Tipos globales compartidos entre features
```

### Flujo de Datos (unidireccional)

```
page.tsx
  └── <FeatureComponent>
        └── useFeatureHook()
              └── featureService.action()
                    └── apiClient.post('/endpoint')
                          └── fetch → Backend ikctl
```

**Regla**: los datos fluyen hacia abajo, las acciones hacia arriba. Nunca saltarse una capa.

---

## 📐 Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes | PascalCase | `LoginForm`, `TwoFactorInput` |
| Hooks | camelCase con `use` | `useLogin`, `useAuthContext` |
| Servicios | camelCase con `Service` | `authService` (objeto) |
| Schemas Zod | camelCase con `Schema` | `loginSchema`, `registerSchema` |
| Tipos derivados | PascalCase | `LoginFormValues`, `AuthTokens` |
| Archivos de página | kebab-case (Next.js) | `page.tsx`, `layout.tsx` |
| Archivos de componente | PascalCase | `LoginForm.tsx` |
| Archivos de hook | camelCase | `useLogin.ts` |
| Constantes | SCREAMING_SNAKE | `API_BASE_URL`, `TOKEN_REFRESH_INTERVAL` |

---

## 🏗️ Estructura de Carpetas Completa

```bash
ikctl-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (providers)
│   │   ├── page.tsx                 # Landing → redirect
│   │   ├── (auth)/                  # Route group - sin auth
│   │   │   ├── login/page.tsx
│   │   │   ├── login/2fa/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   └── password/
│   │   │       ├── forgot/page.tsx
│   │   │       └── reset/page.tsx
│   │   └── (dashboard)/             # Route group - con auth
│   │       ├── layout.tsx           # Verifica sesión
│   │       ├── dashboard/page.tsx
│   │       └── profile/page.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── TwoFactorForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useLogin.ts
│   │   │   │   └── useRegister.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── schemas/
│   │   │   │   ├── loginSchema.ts
│   │   │   │   └── registerSchema.ts
│   │   │   └── types.ts
│   │   └── profile/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── types.ts
│   ├── components/
│   │   └── ui/                      # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── apiClient.ts
│   │   └── utils.ts
│   └── types/
│       └── api.ts                   # Tipos de respuesta del backend
├── docs/
│   ├── requirements.md
│   └── adrs/
├── public/
├── FRONTEND_AGENTS.md
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔌 Consumo de la API ikctl

### apiClient — Instancia central de fetch

**Regla**: NUNCA llamar a `fetch` directamente en componentes o hooks. Siempre usar `apiClient`.

```typescript
// src/lib/apiClient.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include', // siempre — para enviar/recibir cookies
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) throw new ApiError(response.status, await response.json())
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
```

### Servicios — Funciones tipadas por feature

```typescript
// src/features/auth/services/authService.ts
import { apiClient } from '@/lib/apiClient'
import type { LoginResponse, RegisterResponse, AuthTokens } from '@/types/api'

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    apiClient.post<RegisterResponse>('/auth/register', { name, email, password }),

  refresh: () =>
    apiClient.post<AuthTokens>('/auth/refresh', {}),

  logout: (refreshToken: string) =>
    apiClient.post<void>('/auth/logout', { refresh_token: refreshToken }),
}
```

### Manejo de Errores de API

```typescript
// src/lib/apiClient.ts
export class ApiError extends Error {
  constructor(public status: number, public body: Record<string, unknown>) {
    super(`API Error ${status}`)
    this.name = 'ApiError'
  }
}

// En el hook:
try {
  await authService.login(email, password)
} catch (err) {
  if (err instanceof ApiError) {
    if (err.status === 401) form.setError('root', { message: 'Credenciales inválidas' })
    if (err.status === 409) form.setError('email', { message: 'Email ya registrado' })
    if (err.status === 429) setRateLimited(true)
  }
}
```

---

## 🔐 Seguridad: Manejo de Tokens

### Reglas absolutas

1. `access_token` → **solo en memoria** (estado React de `AuthContext`)
2. `refresh_token` → **HttpOnly cookie** (el backend la envía, el cliente nunca la lee)
3. Ambos tokens → **nunca en `localStorage`**, **nunca en la URL**, **nunca en el DOM**

### Patrón de AuthContext

```typescript
// src/contexts/AuthContext.tsx
'use client'

interface AuthContextValue {
  accessToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}
```

### Refresh proactivo

A los 29 minutos de tener un `access_token` (1 min antes de expirar), lanzar refresh silencioso:

```typescript
useEffect(() => {
  if (!accessToken) return
  const timer = setTimeout(() => refreshToken(), 29 * 60 * 1000)
  return () => clearTimeout(timer)
}, [accessToken])
```

### Middleware Next.js

```typescript
// middleware.ts (edge)
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('refresh_token') // solo verifica existencia
  if (!hasSession && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

---

## 🧩 Componentes: Reglas de Diseño

### Server Component vs Client Component

| Usar Server Component | Usar Client Component (`"use client"`) |
|-----------------------|----------------------------------------|
| Layouts de rutas protegidas | Formularios con validación |
| Páginas que cargan datos del perfil | Componentes con estado local |
| Componentes sin interactividad | Componentes con event handlers |
| SEO y metadatos | Acceso a `window`, `document` |

### Estructura de un componente

```typescript
// src/features/auth/components/LoginForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import { useLogin } from '../hooks/useLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export function LoginForm() {
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })
  const { login, isPending } = useLogin()

  return (
    <form onSubmit={form.handleSubmit(login)} noValidate>
      {/* form.formState.errors.root → error genérico */}
      {/* Campos con FormField para aria correcto */}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}
```

### Normas de Accesibilidad en Componentes

- Siempre `<label htmlFor={id}>` o `FormLabel` de shadcn/ui
- Errores de campo en `<FormMessage>` con `role="alert"` implícito
- Botones en estado de carga: `aria-busy="true"` + texto descriptivo
- Mensajes de éxito/error globales: `<div aria-live="polite">`

---

## ✅ Checklist antes de hacer PR

- [ ] TypeScript sin errores (`tsc --noEmit`)
- [ ] ESLint sin warnings (`next lint`)
- [ ] Sin `any` explícito en el código
- [ ] Sin `fetch` directo en componentes o hooks (solo via `apiClient`)
- [ ] Sin tokens en localStorage/sessionStorage
- [ ] Todos los campos de formulario tienen `<label>` asociado
- [ ] Los errores de API se muestran al usuario de forma clara
- [ ] El botón de submit tiene estado de carga
- [ ] Variables de entorno sensibles en `.env.local` (nunca en código)

---

## 📚 Stack Tecnológico Elegido

| Categoría | Librería | Versión | ADR |
|-----------|----------|---------|-----|
| Framework | Next.js | 15.x | [ADR-001](docs/adrs/001-nextjs-app-router.md) |
| Lenguaje | TypeScript | 5.x | ADR-001 |
| Estilos | Tailwind CSS | 4.x | [ADR-004](docs/adrs/004-styling.md) |
| Componentes UI | shadcn/ui | latest | ADR-004 |
| Formularios | React Hook Form | 7.x | [ADR-002](docs/adrs/002-form-validation.md) |
| Validación | Zod | 3.x | ADR-002 |
| Sesión | Contexto React + HttpOnly Cookie | — | [ADR-003](docs/adrs/003-session-management.md) |
| Testing | Vitest + Testing Library | latest | — |
| Linting | ESLint + Prettier | — | — |

---

## 📝 Ejemplo de flujo para un nuevo feature

1. **Definir schema Zod** en `features/<feature>/schemas/`
2. **Definir tipos** en `features/<feature>/types.ts` (derivados del schema)
3. **Implementar servicio** en `features/<feature>/services/` (llama a `apiClient`)
4. **Implementar hook** en `features/<feature>/hooks/` (usa el servicio, maneja estado)
5. **Implementar componente** en `features/<feature>/components/` (usa el hook)
6. **Crear página** en `app/` (thin wrapper que renderiza el componente)
7. **Ejecutar lint + tsc** — verificar sin errores

---

**¿Dudas? Consulta este documento antes de empezar cualquier feature.**
