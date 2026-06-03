<<<<<<< HEAD
# TASKS.md — ikctl-frontend

## Estado general

> Actualizar este fichero tras completar cada tarea.

---

## Fase 0: Infraestructura base

- [x] **T-00.1**: Inicializar proyecto Next.js 16 con App Router, TypeScript y Tailwind v4
- [x] **T-00.2**: Configurar path alias `@/*` → `src/*` en `tsconfig.json`
- [x] **T-00.3**: Instalar dependencias: `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `swr`
- [x] **T-00.4**: Crear `src/lib/api.ts` — instancia Axios con interceptor de auto-refresh (401 → `/api/v1/auth/refresh` → retry)
- [x] **T-00.5**: Crear `src/lib/auth.ts` — helpers `saveTokens`, `clearTokens`, `isAuthenticated`, `getAccessToken`
- [x] **T-00.6**: Crear `src/types/index.ts` — interfaces TypeScript compartidas (`TokenResponse`, `UserProfile`, `Server`, `Operation`, etc.)
- [x] **T-00.7**: Crear `src/lib/services.ts` — todas las funciones de llamada a la API (auth, servers, operations)
- [x] **T-00.8**: Crear componentes UI base: `Button`, `Input`, `Card`, `Alert`, `Badge`

---

## Fase 1: Auth — Páginas públicas

- [x] **T-01.1**: Layout de auth `(auth)/layout.tsx` — centrado en tarjeta, sin navegación
- [x] **T-01.2**: Página `/login` — formulario email + contraseña, manejo de `requires_2fa`, mensajes de error genéricos
- [x] **T-01.3**: Página `/register` — formulario nombre + email + contraseña, validación zod, mensaje genérico en 409
- [x] **T-01.4**: Página `/2fa` — input código TOTP 6 dígitos, lee `temp_token` de query param, redirige a `/dashboard` al completar
- [x] **T-01.5**: Página `/verify-email` — verificación automática al montar, lee `token` de query param
- [x] **T-01.6**: Página `/forgot-password` — solo campo email, siempre mensaje genérico de confirmación
- [x] **T-01.7**: Página `/reset-password` — campos nueva contraseña + confirmación, lee `token` de query param

---

## Fase 2: Dashboard — Infraestructura

- [x] **T-02.1**: Layout de dashboard `dashboard/layout.tsx` — guard client-side (`isAuthenticated()` → redirige a `/login`), sidebar con navegación
- [x] **T-02.2**: Página `/dashboard` (overview) — stats (total servidores, operaciones recientes), accesos directos

---

## Fase 3: Módulo Servers

- [x] **T-03.1**: Página `/dashboard/servers` — listado paginado de servidores con nombre, host, estado y badge de salud
- [x] **T-03.2**: Formulario crear servidor — campos `name`, `host`, `port`, `credential_id`, `description`, validación zod
- [x] **T-03.3**: Formulario editar servidor — mismos campos, precargados con datos existentes
- [x] **T-03.4**: Eliminar servidor — confirmación antes de borrar, manejo de error si tiene operaciones en curso
- [x] **T-03.5**: Health check inline — botón "Verificar" por fila, badge `online`/`offline` + latencia
- [x] **T-03.6**: Página `/dashboard/servers/[id]` — detalle: info completa, SO detectado, historial de operaciones del servidor
- [x] **T-03.7**: Página `/dashboard/credentials` — listado paginado de credenciales (`name`, `type`, `username`)
- [x] **T-03.8**: Formulario crear credencial — campos condicionales según `type` (`ssh`, `git_https`, `git_ssh`), validación por tipo
- [x] **T-03.9**: Formulario editar credencial — indicador "Ya configurado" para `password` y `private_key` (write-only)
- [x] **T-03.10**: Eliminar credencial — confirmación, manejo de error 409 si está en uso

---

## Fase 4: Módulo Operations

- [x] **T-04.1**: Página `/dashboard/operations` — listado paginado con filtros por `server_id`, `status`
- [x] **T-04.2**: Formulario lanzar operación — `server_id` (select), `kit_id` (input), `sudo` (toggle), `debug_level` (select) (**Nota:** `debug_level` y `timeout_seconds` en tipo pero no en formulario UI aún)
- [x] **T-04.3**: Página `/dashboard/operations/[id]` — detalle: estado, servidor, kit, `started_at`, `finished_at`, output (si aplica) (modal en misma página)
- [x] **T-04.4**: Polling automático en detalle de operación mientras `in_progress` (cada 3s, parar en estado terminal)

---

## Correcciones de API (no listadas como tareas originales)

- [x] Fix refresh endpoint: `/api/v1/refresh` → `/api/v1/auth/refresh`
- [x] Fix tipos: `Operation.kit` → `kit_id`, `completed_at` → `finished_at`, +`debug_level`, `sudo`, `started_at`, status expandido con `cancelled`/`cancelled_unsafe`
- [x] Fix tipos: `CreateOperationPayload.kit` → `kit_id`, `variables` → `values`, +`debug_level`, `timeout_seconds`
- [x] Fix tipos: `Server.server_type`/`server_id` revertido a los nombres del backend (`server_type`, `server_id`)
- [x] Fix `CreateServerPayload.credential_id`: aceptar `null` para limpiar credencial al editar
- [x] Fix credenciales: campos condicionales por tipo SSH/Git HTTPS/Git SSH alineados con openapi.yaml
- [x] Refactor credenciales: formulario crear/editar unificado en modal (patrón consistente con servers)
- [x] **T-04.5**: Botón "Cancelar" operación — solo activo en `pending`/`in_progress`, `POST /api/v1/operations/{id}/cancel`
- [x] **T-04.6**: Botón "Reintentar" operación — solo en `failed`/`cancelled_unsafe`, `POST /api/v1/operations/{id}/retry`
- [x] **T-04.7**: Botón "Restaurar backup" — solo en `failed`/`cancelled_unsafe` con backup disponible, `POST /api/v1/operations/{id}/restore`

---

## Fase 5: Módulo Kits

- [x] **T-05.1**: Añadir endpoints de kits/repositorios a `src/lib/services.ts`
- [x] **T-05.2**: Añadir tipos `Repository`, `Kit` a `src/types/index.ts`
- [x] **T-05.3**: Página `/dashboard/kits` — listado paginado de repositorios con nombre, URL, estado de sync y fecha
- [x] **T-05.4**: Formulario registrar repositorio — campos `name`, `url`, `ref` (default `main`), `credential_id` (opcional)
- [x] **T-05.5**: Eliminar repositorio — confirmación antes de borrar
- [x] **T-05.6**: Página `/dashboard/kits/[repo_id]` — kits descubiertos: nombre, versión, descripción, tags, botón "Usar en operación"
- [x] **T-05.7**: Botón "Sincronizar" repositorio — `POST /api/v1/repositories/{id}/sync`, mostrar estado
- [x] **T-05.8**: Badge "Eliminado" para kits con `is_deleted: true` (no seleccionables)
- [x] **T-05.9**: Botón "Usar en operación" — redirigir a `/dashboard/operations?kit_id=<id>` con `kit_id` preseleccionado

---

## Fase 6: Módulo Pipelines

- [ ] **T-06.1**: Añadir endpoints de pipelines a `src/lib/services.ts`
- [ ] **T-06.2**: Añadir tipos `Pipeline`, `PipelineExecution` a `src/types/index.ts`
- [ ] **T-06.3**: Página `/dashboard/pipelines` — listado paginado de pipelines con nombre, descripción y fecha
- [ ] **T-06.4**: Formulario crear pipeline — `name`, `description`, lista de `targets` (servidores), lista de `kits` (con `sudo` y `debug_level` por kit), `values{}` globales
- [ ] **T-06.5**: Formulario editar pipeline — igual que crear, deshabilitado si hay ejecución `in_progress`
- [ ] **T-06.6**: Eliminar pipeline — confirmación, error si hay ejecución `in_progress`
- [ ] **T-06.7**: Página `/dashboard/pipelines/[id]` — detalle del pipeline + historial de ejecuciones paginado + botón "Ejecutar"
- [ ] **T-06.8**: Lanzar ejecución — `POST /api/v1/pipelines/{id}/executions`, redirigir a la ejecución creada
- [ ] **T-06.9**: Página `/dashboard/pipelines/[id]/executions/[exec_id]` — estado agregado, lista de operaciones individuales con enlace a su detalle
- [ ] **T-06.10**: Polling automático en ejecución mientras `in_progress` (cada 5s)

---

## Fase 7: Perfil y cuenta

- [x] **T-07.1**: Página `/dashboard/profile` — mostrar `name` y `email` (no editable)
- [x] **T-07.2**: Formulario actualizar nombre — `PUT /api/v1/auth/users/me`
- [x] **T-07.3**: Sección cambiar contraseña — campos `currentPassword`, `newPassword`, `confirmPassword`, `PUT /api/v1/auth/users/me/password`
- [x] **T-07.4**: Sección 2FA — mostrar estado (activado/desactivado), botón activar/desactivar
- [x] **T-07.5**: Flujo activar 2FA — QR code + campo código TOTP → verify → mostrar backup codes
- [x] **T-07.6**: Flujo desactivar 2FA — pedir contraseña de confirmación → `POST /api/v1/auth/users/me/2fa/disable`
- [x] **T-07.7**: Logout desde la navegación — `POST /api/v1/auth/logout`, limpiar `localStorage`, redirigir a `/login`

---

## Fase 8: Pulido y UX

- [x] **T-08.1**: Redirección automática a `/dashboard` si el usuario ya está autenticado y accede a una ruta auth
- [x] **T-08.2**: Estado de carga global (skeleton o spinner) en páginas del dashboard mientras carga SWR
- [x] **T-08.3**: Mensaje de error global en el dashboard si el backend no responde
- [x] **T-08.4**: Navegación activa en el sidebar (resaltar la sección actual)
- [x] **T-08.5**: Paginación reutilizable — componente `Pagination` con botones anterior/siguiente y total de páginas
- [x] **T-08.6**: Confirmaciones de acciones destructivas con componente `ConfirmDialog` reutilizable
- [x] **T-08.7**: `suppressHydrationWarning` en `<body>` de `layout.tsx` para evitar errores de hidratación por extensiones del browser

---

---

## Fase 9: Grupos de servidores — módulo completo

Implementadas en sesión anterior (no estaban en TASKS.md originales):

- [x] **T-09.1**: Tipo `Group`, `CreateGroupPayload`, `UpdateGroupPayload` en `src/types/index.ts`
- [x] **T-09.2**: Endpoints `getGroups`, `getGroup`, `createGroup`, `updateGroup`, `deleteGroup` en `src/lib/services.ts`
- [x] **T-09.3**: Página `/dashboard/groups` — listado paginado, modal crear/editar con selector de servidores por checkbox, `ConfirmDialog` para borrar
- [x] **T-09.4**: Entrada "Groups" en el sidebar (`dashboard/layout.tsx`) entre Servers y Operations

---

## Fase 10: Soporte de grupos en operaciones (batch)

> Requiere cambios en **backend** (ikctl) y después en **frontend** (ikctl-frontend).
> El backend no tiene ningún soporte de grupos en el módulo de operaciones todavía.

### 10-A: Backend — Capa de dominio y aplicación

- [x] **T-10.1**: Añadir `find_group_by_id_internal(group_id: str) -> Optional[Group]` y `find_servers_by_ids(server_ids: list[str]) -> list[Server]` al port `operations/application/interfaces/server_repository.py`
- [x] **T-10.2**: Crear DTO `BatchOperationResult(operations: list[OperationResult])` en `operations/application/dtos/operation_dtos.py`
- [x] **T-10.3**: Crear caso de uso `LaunchBatchOperation` en `operations/application/commands/launch_batch_operation.py` — recibe `group_id`, resuelve el grupo, itera sobre `server_ids` llamando a la lógica de `LaunchOperation` por cada servidor, devuelve `BatchOperationResult`
- [x] **T-10.4**: Añadir excepción de aplicación `GroupNotFoundError` a `operations/application/exceptions.py`

### 10-B: Backend — Capa de infraestructura

- [x] **T-10.5**: Implementar `find_group_by_id_internal` y `find_servers_by_ids` en `operations/infrastructure/adapters/server_read_adapter.py` (siguiendo el patrón del adapter de pipelines)
- [x] **T-10.6**: Registrar `LaunchBatchOperation` en `operations/infrastructure/presentation/deps.py` — inyectar el mismo `ServerReadAdapter` extendido
- [x] **T-10.7**: Añadir handler `GroupNotFoundError → 404` en `operations/infrastructure/presentation/exception_handlers.py`

### 10-C: Backend — Capa de presentación

- [x] **T-10.8**: Actualizar `LaunchOperationRequest` en `operations/infrastructure/presentation/schemas.py`:
  - `server_id` pasa a ser opcional (`str | None = None`)
  - Añadir `group_id: str | None = None`
  - Añadir validador `@model_validator`: exactamente uno de `server_id` / `group_id` debe estar presente
- [x] **T-10.9**: Añadir schema `BatchOperationResponse(operations: list[OperationResponse])` en `schemas.py`
- [x] **T-10.10**: Actualizar ruta `POST /api/v1/operations` en `routes.py`:
  - Si `server_id` → comportamiento actual, devuelve `OperationResponse` (201)
  - Si `group_id` → usa `LaunchBatchOperation`, devuelve `BatchOperationResponse` (201)

### 10-D: Backend — Documentación

- [x] **T-10.11**: Actualizar `openapi.yaml` — schema `OperationLaunch`:
  - `server_id` pasa a opcional
  - Añadir `group_id: string` opcional
  - Añadir nota: exactamente uno de los dos es obligatorio
- [x] **T-10.12**: Añadir schema `BatchOperationResponse` en `openapi.yaml` con `operations: array<Operation>`
- [x] **T-10.13**: Actualizar respuesta `POST /api/v1/operations` en `openapi.yaml`:
  - `201` con `oneOf: [OperationResponse, BatchOperationResponse]` (discriminado por presencia de `group_id` en request)
- [x] **T-10.14**: Corregir discrepancias existentes en `openapi.yaml` detectadas en el audit:
  - `Operation.id` → `operation_id`
  - Añadir `backup_files` y `updated_at` al schema `Operation`
  - Eliminar `error` del schema `Operation` (no existe en `OperationResponse` Pydantic)
  - Corregir código de respuesta `POST /api/v1/operations`: `202` → `201`

### 10-E: Frontend

- [x] **T-10.15**: Actualizar `CreateOperationPayload` en `src/types/index.ts`: `server_id` opcional, añadir `group_id?: string`; añadir tipo `BatchOperationResponse`
- [x] **T-10.16**: Actualizar `createOperation` en `src/lib/services.ts` para devolver `Operation | BatchOperationResponse`
- [x] **T-10.17**: Añadir selector de target en `RunOperationModal`: radio `Single server` / `Group`; mostrar select de servidores o select de grupos según selección
- [x] **T-10.18**: Manejar respuesta batch en `OperationsPageInner`: si es `BatchOperationResponse`, prepend de todas las operaciones a la lista, iniciar polling de la primera operación activa

---

## Convenciones de este fichero

- `[x]` tarea completada
- `[ ]` tarea pendiente
- Las tareas se hacen **una por una** con aprobación entre cada paso (ver AGENTS.md)
- Ejecutar `npx tsc --noEmit` + `npm run lint` tras cada tarea antes de marcarla como completada
=======
# Tareas del Frontend ikctl v1.0.0

**Estado:** Base implementada ✅ — flujos auth en curso

---

## Fase 1: Base e Infraestructura ✅ COMPLETADA

- [x] **T-01**: `lib/apiClient.ts` — fetch wrapper con `ApiError`, credentials, 204 support ✅
- [x] **T-02**: `types/api.ts` — tipos de respuesta del backend (`LoginResponse`, `AuthTokens`, `UserProfile`, `Enable2FAResponse`, `MessageResponse`, `ApiErrorBody`) ✅
- [x] **T-03**: `contexts/AuthContext.tsx` — `accessToken` en memoria, `tempToken` para 2FA, `silentRefresh`, refresh proactivo con `setTimeout` ✅
- [x] **T-04**: Security headers en `next.config.ts` — `CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (RNF-02) ✅
- [x] **T-05**: shadcn/ui base — `button`, `card`, `form`, `input`, `label`, `badge`, `sonner` ✅
- [x] **T-06**: Layouts de rutas — `(auth)/layout.tsx` centrado, `(dashboard)/layout.tsx` con header, root `page.tsx` redirige a `/login` ✅

---

## Fase 2: Feature Auth — Registro y Login ✅ COMPLETADA

- [x] **T-07**: Schema Zod `registerSchema` (name, email lowercase, password con reglas de complejidad) ✅
- [x] **T-08**: Schema Zod `loginSchema` (email, password) ✅
- [x] **T-09**: Schema Zod `twoFactorSchema` (code, exactamente 6 dígitos numéricos) — en `registerSchema.ts` ✅
- [x] **T-10**: `authService.ts` — todos los endpoints del backend (register, login, loginWith2FA, refresh, logout, forgotPassword, resetPassword, changePassword, enable2FA, disable2FA, resendVerification, verifyEmail, getGitHubAuthUrl) ✅
- [x] **T-11**: `RegisterForm.tsx` + `useRegister.ts` — RF-01, RF-03, RF-04 (409 email duplicado) ✅
- [x] **T-12**: `LoginForm.tsx` + `useLogin.ts` — RF-06, RF-07 (redirect 2FA), RF-08, RF-09 (429 rate limit), RF-10 (enlace forgot) ✅
- [x] **T-13**: `TwoFactorForm.tsx` — RF-11, RF-12, RF-13 — lógica inline en componente ✅
- [x] **T-14**: Página `/register` ✅
- [x] **T-15**: Página `/register/success` — mensaje "Revisa tu email" (RF-02) ✅
- [x] **T-16**: Página `/login` ✅
- [x] **T-17**: Página `/login/2fa` — recibe `tempToken` desde `AuthContext` (RF-11) ✅

---

## Fase 3: Feature Auth — Email y Contraseña

- [x] **T-18**: Schema Zod `verifyEmailSchema` (token: string requerido) ✅
- [x] **T-19**: Hook `useVerifyEmail` — llama `authService.verifyEmail(token)`, maneja token inválido/expirado y botón de reenvío ✅
- [x] **T-20**: Página `/verify-email` — lee `?token=` de la URL, muestra estado (cargando / éxito / error + reenvío) (RF-02, RF-05) ✅
- [x] **T-21**: Schema Zod `forgotPasswordSchema` (email: formato válido) ✅
- [x] **T-22**: Hook `useForgotPassword` — llama `authService.forgotPassword(email)`, siempre muestra mensaje genérico (no revelar si el email existe) ✅
- [x] **T-23**: `ForgotPasswordForm.tsx` + Página `/password/forgot` (RF-10) ✅
- [x] **T-24**: Schema Zod `resetPasswordSchema` (new_password con reglas de complejidad, confirm_password igual) ✅
- [x] **T-25**: Hook `useResetPassword` — lee el token de la URL, llama `authService.resetPassword(token, newPassword)`, redirige a `/login` tras éxito ✅
- [x] **T-26**: `ResetPasswordForm.tsx` + Página `/password/reset` (RF-10) ✅

---

## Fase 4: Protección de Rutas (Middleware)

- [x] **T-27**: `middleware.ts` en raíz de `src/` — protege rutas `(dashboard)` redirigiendo a `/login` si no hay cookie de sesión válida (RNF-09: Server Components para rutas protegidas) ✅ (era `proxy.ts`, renombrado)
- [x] **T-28**: `(dashboard)/layout.tsx` — verificación de sesión con `silentRefresh` al montar; si falla → `router.push('/login')` (RF-16) ✅
- [x] **T-29**: Corrección `ACCESS_TOKEN_TTL_MS` en `AuthContext.tsx` — cambiado de 30 min a 15 min para coincidir con el backend (actualmente hay discrepancia) ✅

---

## Fase 5: Feature Profile

- [x] **T-30**: Schema Zod `profileSchema` (name: 2-100 caracteres, trim) ✅
- [x] **T-31**: Schema Zod `changePasswordSchema` (current_password, new_password con reglas, confirm_password igual) ✅
- [x] **T-32**: Schema Zod `enable2FAVerifySchema` (code: 6 dígitos numéricos) — para confirmar activación de 2FA ✅
- [x] **T-33**: `profileService.ts` — `getProfile(accessToken)`, `updateProfile(accessToken, name)` (RF-18) ✅
- [x] **T-34**: Hook `useProfile` — obtiene perfil del usuario autenticado, maneja carga y error ✅
- [x] **T-35**: `ProfileForm.tsx` — muestra y permite editar nombre (RF-18) ✅
- [x] **T-36**: Hook `useChangePassword` — llama `authService.changePassword(...)`, maneja error de contraseña actual incorrecta (RF-19) ✅
- [x] **T-37**: `ChangePasswordForm.tsx` — formulario con current_password y new_password (RF-19) ✅
- [x] **T-38**: Hook `useEnable2FA` / `useDisable2FA` — llama `authService.enable2FA(...)`, muestra QR code y secret, luego verifica código para confirmar (RF-20) ✅
- [x] **T-39**: `TwoFASettings.tsx` — muestra estado 2FA, botón activar/desactivar, flujo QR + verificación (RF-20) ✅
- [x] **T-40**: Página `/profile` — composición de `ProfileForm`, `ChangePasswordForm`, `TwoFASettings` (RF-18, RF-19, RF-20) ✅
- [x] **T-41**: Añadir enlace a `/profile` en el header del dashboard layout ✅

---

## Fase 6: Accesibilidad y UX (RNF)

- [x] **T-42**: Verificar `aria-live="polite"` en todos los mensajes de error de formulario — presente en todos los componentes (RNF-12) ✅
- [x] **T-43**: Indicadores de carga accesibles — `aria-busy` en formularios y textos de estado (RNF-15) ✅
- [ ] **T-44**: Test de navegación por teclado en todos los formularios (Tab, Enter, Escape) (RNF-13)
- [ ] **T-45**: Verificar contraste WCAG AA (4.5:1) en todos los textos y componentes (RNF-14)

---

## Fase 7: GitHub OAuth

- [x] **T-46**: `authService.gitHubCallback(code, state)` — llama a `GET /api/v1/auth/login/github/callback?code=...&state=...` y devuelve `LoginResponse` ✅
- [x] **T-47**: `completeGitHubLogin(code, state)` en `AuthContext` — intercambia code+state por tokens, guarda `access_token` en memoria y programa refresh proactivo ✅
- [x] **T-48**: Hook `useGitHubLogin` — obtiene `authorization_url` del backend con `getGitHubAuthUrl()` y redirige el navegador a GitHub con `globalThis.location.href` ✅
- [x] **T-49**: Botón "Continuar con GitHub" en `LoginForm.tsx` — separador visual, icono SVG GitHub, deshabilita ambos botones durante operación, error accesible (`aria-live`) ✅
- [x] **T-50**: Página `/login/github/callback` — lee `code`+`state` de query params, llama `completeGitHubLogin`, redirige a `/dashboard` con `router.replace`; spinner accesible en carga, mensaje de error específico en fallo ✅

---

## Resumen de Estado

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Base e infraestructura | ✅ Completada |
| Fase 2 | Feature Auth (registro, login, 2FA) | ✅ Completada |
| Fase 3 | Feature Auth (email, password forgot/reset) | ✅ Completada |
| Fase 4 | Protección de rutas | ✅ Completada |
| Fase 5 | Feature Profile | ✅ Completada |
| Fase 6 | Accesibilidad y UX | ⚪ Parcial (T-42, T-43 ✅ — T-44, T-45 requieren QA manual) |
| Fase 7 | GitHub OAuth | ✅ Completada |
| Fase 8 | Feature Credentials | ⚪ Pendiente |
| Fase 9 | Feature Servers | ⚪ Pendiente |
| Fase 10 | Feature Groups | ⚪ Pendiente |

---

## Fase 8: Feature Credentials

- [x] **T-51**: Schema Zod `credentialSchema` — campos `name`, `type` (enum `ssh|git_https|git_ssh`), `username`, `password`, `private_key` con validaciones (RF-22, RF-23, RN) ✅
- [x] **T-52**: Types TS — añadir `CredentialResponse`, `CredentialListResponse` en `types/api.ts` ✅
- [x] **T-53**: `credentialsService.ts` — `list(page, perPage)`, `get(id)`, `create(body)`, `update(id, body)`, `delete(id)` usando `apiClient` (RF-21 a RF-26) ✅
- [x] **T-54**: `useCredentials.ts` + `useCreateCredential.ts` + `useUpdateCredential.ts` + `useDeleteCredential.ts` ✅
- [x] **T-55**: `CredentialsList.tsx` — tabla paginada (nombre, tipo, username, fecha) + estados vacío y carga (RF-21, RF-26, RNF-16) ✅
- [x] **T-56**: `CredentialForm.tsx` — formulario modal create/edit, campo `type` cambia campos visibles (ssh muestra `private_key`, otros `password`) (RF-22, RF-23, RF-24) ✅
- [x] **T-57**: Páginas `(dashboard)/credentials/page.tsx` — composición lista + form + delete confirmation (RF-25) ✅
- [x] **T-58**: TypeCheck + lint pass (`tsc --noEmit && eslint`) ✅

---

## Fase 9: Feature Servers

- [x] **T-59**: Schemas Zod — `registerServerSchema` (remote), `registerLocalServerSchema`, `updateServerSchema`, `adHocCommandSchema` con validaciones de RN ✅
- [x] **T-60**: Types TS — añadir `ServerResponse`, `ServerListResponse`, `HealthCheckResponse`, `AdHocCommandResponse` en `types/api.ts` ✅
- [x] **T-61**: `serversService.ts` — `list`, `get`, `create` (remote/local discriminador), `update`, `delete`, `toggle`, `health`, `command` (RF-27 a RF-38) ✅
- [x] **T-62**: Hooks — `useServers`, `useCreateServer`, `useUpdateServer`, `useDeleteServer`, `useToggleServer` ✅
- [x] **T-63**: `ServersList.tsx` — tabla paginada con badge de estado/tipo, servidores deshabilitados diferenciados (RF-27, RF-38) ✅
- [x] **T-64**: `RegisterServerForm.tsx` — formulario con discriminador local/remote (muestra/oculta campos según tipo) (RF-28, RF-29, RF-30) ✅
- [x] **T-65**: `ServerDetail.tsx` + `ServerHealthCard.tsx` + `AdHocCommandPanel.tsx` — detalle + health check + ejecución con salida `<pre>` (RF-31, RF-35, RF-36, RF-37, RNF-18) ✅
- [x] **T-66**: Páginas `(dashboard)/servers/page.tsx` + `(dashboard)/servers/[id]/page.tsx` ✅
- [x] **T-67**: TypeCheck + lint pass ✅

---

## Fase 10: Feature Groups

- [x] **T-68**: Schema Zod `groupSchema` — `name`, `description`, `server_ids` con validaciones de RN ✅
- [x] **T-69**: Types TS — añadir `GroupResponse`, `GroupListResponse` en `types/api.ts` ✅
- [x] **T-70**: `groupsService.ts` — `list`, `get`, `create`, `update`, `delete` ✅
- [x] **T-71**: Hooks — `useGroups`, `useCreateGroup`, `useUpdateGroup`, `useDeleteGroup` ✅
- [x] **T-72**: `GroupsList.tsx` — tabla paginada (nombre, descripción, nº servidores) (RF-39) ✅
- [x] **T-73**: `GroupForm.tsx` — formulario create/edit con multi-select de servidores activos del usuario (RF-40, RF-41, RF-43) ✅
- [x] **T-74**: Página `(dashboard)/groups/page.tsx` — lista + form + delete con error 409 (RF-42) ✅
- [x] **T-75**: TypeCheck + lint pass ✅
>>>>>>> origin/main
