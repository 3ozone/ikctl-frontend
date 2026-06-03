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
