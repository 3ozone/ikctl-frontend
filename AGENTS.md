# AGENTS.md - ikctl-frontend

## Proceso obligatorio

Cada cambio se hace **UNO POR UNO** con aprobación entre pasos:

1. Planificar → pedir permiso
2. Implementar → pedir permiso
3. Validar (`npx tsc --noEmit` + `npm run lint`) → pedir permiso
4. Siguiente tarea

Los ficheros de documentación (`AGENTS.md`, `README.md`, `docs/`) se pueden actualizar libremente sin aprobación paso a paso.

## Comandos

```bash
npm run dev        # Dev server
npm run build      # Build producción
npm run lint       # ESLint (flat config, eslint-config-next + TypeScript)
npx tsc --noEmit   # Type check (no existe script `typecheck`)
```

No hay framework de tests. Validar siempre con `tsc --noEmit` + `lint` antes de cerrar una tarea.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 via `@tailwindcss/postcss` — no hay `tailwind.config.js`
- Axios con interceptor de auto-refresh
- react-hook-form + zod (v4) + @hookform/resolvers
- SWR para data fetching en dashboard
- Sin librería de componentes UI — hand-rolled en `src/components/ui/`

## Arquitectura

```
src/
├── app/
│   ├── (auth)/          # Rutas públicas: login, register, 2fa, forgot/reset password, verify-email
│   │   └── layout.tsx   # Layout centrado (card), sin nav
│   └── dashboard/       # Rutas protegidas: servers, operations, profile
│       └── layout.tsx   # Auth guard client-side (isAuthenticated()), sidebar+nav
├── components/ui/       # Button, Input, Card, Alert, Badge
├── lib/
│   ├── api.ts           # Instancia axios + interceptores (attach token, auto-refresh 401)
│   ├── auth.ts          # Helpers localStorage (saveTokens, clearTokens, isAuthenticated)
│   └── services.ts      # Todas las llamadas API (auth, users, servers, operations)
└── types/index.ts       # Interfaces compartidas
```

## Autenticación

- Tokens en **localStorage** (`access_token`, `refresh_token`). Sin cookies, sin Next.js middleware.
- Dashboard guard es **client-side only**: `dashboard/layout.tsx` comprueba `isAuthenticated()` y redirige a `/login`.
- Auto-refresh: el interceptor 401 en `api.ts` llama a `POST /api/v1/refresh` y reintenta la petición original. Si falla, limpia tokens y redirige a `/login`.
- Login envía `{ email, password }` como JSON (no form-urlencoded). Si la respuesta incluye `requires_2fa`, redirige a `/2fa?token=<temp_token>`.

## API y entorno

- `NEXT_PUBLIC_API_URL` debe apuntar **solo al origen** (ej. `http://localhost:8000`). No incluir `/api/v1` — `services.ts` ya añade el prefijo a cada endpoint.
- El refresh token endpoint es `POST /api/v1/refresh` (sin `/auth/`), diferente del resto.
- Todas las rutas auth usan `/api/v1/auth/...`, servers `/api/v1/servers/...`, operations `/api/v1/operations/...`.

## Convenciones

- Path alias: `@/*` → `src/*`
- Componentes: PascalCase en fichero y export (`Button`, `ServerCard`)
- Servicios: funciones sueltas exportadas de `services.ts`, nunca clases
- Tipos: interfaces en `types/index.ts`; tipos locales inline si son de un solo uso
- Tailwind: clases directamente en JSX, sin CSS modules salvo `globals.css`
- ESLint: flat config en `eslint.config.mjs`
- Formularios: react-hook-form + zod, botón deshabilitado durante `isSubmitting`
- Errores: inline con `Alert`, sin modales ni toasts

## Estado del proyecto

Ver `docs/TASKS.md` para el listado completo de tareas. Fases 0-2 y parte de 3-4 completadas. Módulos de Kits, Pipelines y gran parte de Operations/Servers/Profile están pendientes.