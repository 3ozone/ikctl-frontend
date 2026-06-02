# Requisitos del Frontend — ikctl-frontend

## Introducción

ikctl-frontend es la interfaz web de ikctl, un gestor remoto de aplicaciones vía SSH. Permite a los usuarios registrarse, autenticarse, gestionar servidores remotos, ejecutar kits de instalación/configuración y orquestar pipelines de operaciones. El frontend se comunica con el backend ikctl a través de su API REST (`/api/v1/...`).

El proyecto usa **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind v4**, **Axios**, **react-hook-form + zod** y **SWR**.

---

## Actores

### Usuario no autenticado

- Registrarse con nombre, email y contraseña
- Iniciar sesión (local o GitHub OAuth)
- Solicitar y completar el reset de contraseña
- Verificar su email con el token recibido

### Usuario autenticado

- Gestionar sus servidores remotos y credenciales SSH
- Explorar kits de sus repositorios Git
- Lanzar operaciones (instalar/configurar software en servidores)
- Gestionar pipelines y ver el historial de ejecuciones
- Consultar y actualizar su perfil
- Activar y desactivar 2FA

---

## Glosario

- **Access Token**: JWT de corta duración en `localStorage`. Se envía como `Authorization: Bearer`.
- **Refresh Token**: Token de larga duración en `localStorage`. Se usa para renovar el access token automáticamente.
- **Auto-refresh**: El interceptor de Axios en `lib/api.ts` detecta 401, llama a `/api/v1/auth/refresh` y reintenta la petición original. Si falla, limpia tokens y redirige a `/login`.
- **Guard client-side**: `dashboard/layout.tsx` llama a `isAuthenticated()` al montar y redirige a `/login` si no hay sesión válida.
- **Kit**: Unidad de instalación/configuración declarada en un manifiesto `ikctl.yaml` dentro de un repositorio Git.
- **Operación**: Ejecución de un kit sobre un servidor concreto. Tiene un ciclo de vida: `pending` → `in_progress` → `completed` / `failed` / `cancelled`.
- **Pipeline**: Definición reutilizable que combina N kits con M servidores. Al lanzarlo se generan N×M operaciones.
- **Credencial**: Objeto reutilizable con datos SSH o Git (usuario, contraseña o clave privada). Varias entidades pueden referenciarlo.

---

## Módulo Auth

### Páginas

| Ruta | Descripción |
|---|---|
| `/login` | Formulario email + contraseña. Botón GitHub OAuth. |
| `/register` | Formulario nombre + email + contraseña. |
| `/2fa` | Input código TOTP 6 dígitos. Token temporal por query param `?token=`. |
| `/verify-email` | Verificación automática al montar. Token por query param `?token=`. |
| `/forgot-password` | Solo campo email. Muestra siempre mensaje genérico. |
| `/reset-password` | Campos nueva contraseña + confirmación. Token por query param `?token=`. |
| `/dashboard/profile` | Ver/editar nombre, cambiar contraseña, gestionar 2FA. |

### Flujos principales

**Login** → `POST /api/v1/auth/login` → si `requires_2fa: true` redirige a `/2fa?token=<temp_token>`, si no guarda tokens y va a `/dashboard`.

**2FA** → `POST /api/v1/auth/login/2fa` con `{temp_token, code}` → guarda tokens, va a `/dashboard`.

**Registro** → `POST /api/v1/auth/register` → mensaje "Revisa tu email". Error 409 → mensaje genérico (no revelar que el email existe).

**Reset de contraseña** → `/forgot-password` llama a `POST /api/v1/auth/password/forgot` → siempre muestra "Si el email existe recibirás instrucciones". `/reset-password?token=` llama a `POST /api/v1/auth/password/reset`.

**Activar 2FA** → `POST /api/v1/auth/users/me/2fa/enable` → mostrar QR + campo código → `POST /api/v1/auth/users/me/2fa/verify` → mostrar backup codes.

**Logout** → `POST /api/v1/auth/logout` → limpiar `localStorage` → redirigir a `/login`.

### Endpoints consumidos

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/login/2fa
POST /api/v1/auth/logout
POST /api/v1/auth/refresh              ← automático vía interceptor
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/password/forgot
POST /api/v1/auth/password/reset
GET  /api/v1/auth/users/me
PUT  /api/v1/auth/users/me
PUT  /api/v1/auth/users/me/password
POST /api/v1/auth/users/me/2fa/enable
POST /api/v1/auth/users/me/2fa/verify
POST /api/v1/auth/users/me/2fa/disable
```

### Requisitos funcionales

- **RF-A01**: Validación client-side con zod: email válido, contraseña ≥8 caracteres con mayúscula, minúscula y número.
- **RF-A02**: Mensajes de error genéricos en login (no revelar qué campo es incorrecto) y en registro (no revelar si el email ya existe).
- **RF-A03**: Redirección automática a `/dashboard` si el usuario ya está autenticado y accede a una ruta auth.
- **RF-A04**: El campo `email` del perfil no es editable (el backend no expone ese endpoint).
- **RF-A05**: Al activar 2FA, no permitir cerrar el flujo hasta completar la verificación del código TOTP.
- **RF-A06**: Los formularios deshabilitan el botón de envío durante `isSubmitting` para evitar doble envío.

---

## Módulo Servers

### Páginas

| Ruta | Descripción |
|---|---|
| `/dashboard/servers` | Listado paginado de servidores. Botón crear. |
| `/dashboard/servers/[id]` | Detalle de un servidor: info, estado de salud, SO detectado, historial de operaciones. |
| `/dashboard/credentials` | Listado paginado de credenciales. CRUD completo. |

### Flujos principales

**Listado de servidores** → `GET /api/v1/servers?page=1&limit=20` → tabla con nombre, host, estado (`active`/`inactive`), badge de salud.

**Crear servidor** → formulario con `name`, `host`, `port` (default 22), `credential_id`, `description`. `POST /api/v1/servers`.

**Health check** → botón "Verificar" por servidor → `GET /api/v1/servers/{id}/health` → mostrar `online`/`offline` y latencia.

**Credenciales** → CRUD via `GET|POST|PUT|DELETE /api/v1/credentials`. Los campos `password` y `private_key` son write-only (el backend nunca los devuelve, solo mostrar indicador "configurado").

### Tipos de credencial

| Tipo | Campos requeridos |
|---|---|
| `ssh` | `username` + (`password` o `private_key`) |
| `git_https` | `username` + `password` (Personal Access Token) |
| `git_ssh` | `private_key` |

### Endpoints consumidos

```
GET    /api/v1/servers
POST   /api/v1/servers
GET    /api/v1/servers/{id}
PUT    /api/v1/servers/{id}
DELETE /api/v1/servers/{id}
GET    /api/v1/servers/{id}/health
GET    /api/v1/credentials
POST   /api/v1/credentials
GET    /api/v1/credentials/{id}
PUT    /api/v1/credentials/{id}
DELETE /api/v1/credentials/{id}
```

### Requisitos funcionales

- **RF-S01**: Listado con paginación. Parámetros `page` y `limit` en query string.
- **RF-S02**: Formulario de crear/editar servidor valida `host` (formato hostname o IP), `port` (1–65535), `credential_id` requerido para tipo `remote`.
- **RF-S03**: Confirmación antes de eliminar servidor o credencial.
- **RF-S04**: No se puede eliminar una credencial que esté en uso por un servidor activo (el backend devuelve 409 — mostrar mensaje claro).
- **RF-S05**: En el formulario de credencial, los campos `password` y `private_key` tienen un indicador visual "Ya configurado" si el registro existe, y solo se envían si se modifican.
- **RF-S06**: El tipo de credencial determina qué campos mostrar en el formulario (renderizado condicional).

---

## Módulo Operations

### Páginas

| Ruta | Descripción |
|---|---|
| `/dashboard/operations` | Listado paginado de operaciones con filtros. Botón lanzar. |
| `/dashboard/operations/[id]` | Detalle: estado, servidor, kit, output (si `debug_level` != `none`), botones cancelar/reintentar. |

### Flujos principales

**Lanzar operación** → formulario con `server_id` (select de servidores), `kit_id` (selector o input libre), `values{}` (JSON o campos clave-valor), `sudo` (toggle), `debug_level` (select) → `POST /api/v1/operations`.

**Polling de estado** → mientras la operación está `in_progress`, hacer polling cada 3s a `GET /api/v1/operations/{id}` para actualizar estado y output.

**Cancelar** → `POST /api/v1/operations/{id}/cancel`. Solo disponible en `pending` o `in_progress`.

**Reintentar** → `POST /api/v1/operations/{id}/retry`. Solo disponible en `failed` o `cancelled_unsafe`.

**Restaurar backup** → `POST /api/v1/operations/{id}/restore`. Solo disponible en `failed` o `cancelled_unsafe` con backup disponible.

### Estados y badges

| Estado | Color |
|---|---|
| `pending` | warning (amarillo) |
| `in_progress` | info (azul) |
| `completed` | success (verde) |
| `failed` | error (rojo) |
| `cancelled` | default (gris) |
| `cancelled_unsafe` | warning (naranja) |

### Endpoints consumidos

```
GET  /api/v1/operations
POST /api/v1/operations
GET  /api/v1/operations/{id}
POST /api/v1/operations/{id}/cancel
POST /api/v1/operations/{id}/retry
POST /api/v1/operations/{id}/restore
```

### Requisitos funcionales

- **RF-O01**: Filtros en el listado: `server_id`, `kit_id`, `status`.
- **RF-O02**: El output de la operación solo se muestra si `debug_level` es `errors` o `full`.
- **RF-O03**: Polling automático en la página de detalle mientras `status === 'in_progress'` (cada 3s). Detener al llegar a estado terminal.
- **RF-O04**: Mostrar spinner/indicador de "En ejecución" mientras `in_progress`.
- **RF-O05**: El botón "Cancelar" solo está activo en `pending` o `in_progress`. "Reintentar" y "Restaurar" solo en estados terminales con error.

---

## Módulo Kits

### Páginas

| Ruta | Descripción |
|---|---|
| `/dashboard/kits` | Listado paginado de repositorios Git registrados. Botón añadir. |
| `/dashboard/kits/[repo_id]` | Kits descubiertos en el repositorio. Botón sincronizar. |

### Flujos principales

**Registrar repositorio** → formulario con `name`, `url` (URL del repo Git), `ref` (branch/tag, default `main`), `credential_id` (opcional para repos públicos) → `POST /api/v1/repositories`.

**Ver kits de un repositorio** → `GET /api/v1/repositories/{id}/kits` → listado con nombre, versión, descripción, tags y botón "Usar en operación".

**Sincronizar** → botón "Sync" → `POST /api/v1/repositories/{id}/sync` → mostrar estado de la sincronización.

### Endpoints consumidos

```
GET    /api/v1/repositories
POST   /api/v1/repositories
GET    /api/v1/repositories/{id}
DELETE /api/v1/repositories/{id}
POST   /api/v1/repositories/{id}/sync
GET    /api/v1/repositories/{id}/kits
GET    /api/v1/kits/{id}
```

### Requisitos funcionales

- **RF-K01**: Mostrar estado de la última sincronización (`last_sync_at`, `sync_status`).
- **RF-K02**: Un kit con `is_deleted: true` se muestra con badge "Eliminado" en gris y no es seleccionable para operaciones.
- **RF-K03**: Al pulsar "Usar en operación" en un kit, redirigir a `/dashboard/operations` con `kit_id` preseleccionado.
- **RF-K04**: Mostrar los `tags` de cada kit como badges.

---

## Módulo Pipelines

### Páginas

| Ruta | Descripción |
|---|---|
| `/dashboard/pipelines` | Listado de pipelines (templates). Botón crear. |
| `/dashboard/pipelines/[id]` | Detalle del pipeline: configuración, historial de ejecuciones. |
| `/dashboard/pipelines/[id]/executions/[exec_id]` | Detalle de una ejecución: estado agregado, operaciones individuales. |

### Flujos principales

**Crear pipeline** → formulario con `name`, `description`, lista de `targets` (servidores), lista de `kits` (con `sudo` y `debug_level` por kit), `values{}` globales → `POST /api/v1/pipelines`.

**Lanzar ejecución** → botón "Ejecutar" en el detalle del pipeline → `POST /api/v1/pipelines/{id}/executions` → redirigir a la ejecución creada.

**Ver estado de ejecución** → polling en `in_progress` → `GET /api/v1/pipelines/{id}/executions/{exec_id}` → estado agregado + lista de operaciones individuales con su estado.

### Estados de ejecución y badges

| Estado | Significado | Color |
|---|---|---|
| `pending` | Generando operaciones | warning |
| `in_progress` | Al menos una operación activa | info |
| `completed` | Todas completadas | success |
| `failed` | Todas fallaron | error |
| `partial` | Algunas completaron, otras fallaron | warning |

### Endpoints consumidos

```
GET    /api/v1/pipelines
POST   /api/v1/pipelines
GET    /api/v1/pipelines/{id}
PUT    /api/v1/pipelines/{id}
DELETE /api/v1/pipelines/{id}
POST   /api/v1/pipelines/{id}/executions
GET    /api/v1/pipelines/{id}/executions
GET    /api/v1/pipelines/{id}/executions/{exec_id}
```

### Requisitos funcionales

- **RF-P01**: El pipeline no se puede editar ni eliminar si tiene ejecuciones en `in_progress` (el backend devuelve error — mostrar mensaje).
- **RF-P02**: Polling automático en la página de ejecución mientras `status === 'in_progress'` (cada 5s).
- **RF-P03**: Mostrar el `snapshot` de la ejecución (configuración usada) diferenciado de la configuración actual del pipeline.
- **RF-P04**: En la vista de ejecución, enlazar cada operación individual a su página de detalle en `/dashboard/operations/{id}`.

---

## Requisitos No Funcionales Globales

- **RNF-01**: Data fetching en el dashboard con **SWR** (caché automático, revalidación en foco).
- **RNF-02**: Paginación obligatoria en todos los listados (`page` + `limit`).
- **RNF-03**: Formularios con **react-hook-form** + **zod** para evitar re-renders innecesarios.
- **RNF-04**: Navegación por teclado y atributos `aria-*` correctos en todos los componentes interactivos.
- **RNF-05**: Los tokens nunca se incluyen en URLs ni en logs del cliente.
- **RNF-06**: Confirmación antes de acciones destructivas (eliminar, cancelar operación en curso).
- **RNF-07**: Los formularios muestran estado de carga deshabilitando el botón durante `isSubmitting`.
- **RNF-08**: Mensajes de error inline (componente `Alert`) — no modales ni toasts.
- **RNF-09**: `NEXT_PUBLIC_API_URL` apunta solo al origen (`http://localhost:8000`). Los paths `/api/v1/...` los añade `services.ts`.
- **RNF-10**: Validar siempre con `npx tsc --noEmit` y `npm run lint` antes de dar una tarea por terminada.
