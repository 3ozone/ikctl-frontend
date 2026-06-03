<<<<<<< HEAD
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
=======
# Requisitos del Frontend ikctl v1.0.0

**Fecha:** 2026-03-09
**Estado:** Borrador inicial
**Backend:** [ikctl API](../../../ikctl/openapi.yaml) · Base URL `http://localhost:8000/api/v1`

---

## Reglas Funcionales (RF)

### Flujo de Registro

| ID | Requisito |
|----|-----------|
| RF-01 | El usuario puede registrarse con nombre, email y contraseña |
| RF-02 | Tras registrarse se muestra mensaje "Revisa tu email para verificar tu cuenta" |
| RF-03 | El formulario no se puede enviar con campos vacíos ni con email malformado |
| RF-04 | Si el email ya existe (API 409) se muestra error específico bajo el campo email |
| RF-05 | El usuario puede solicitar reenvío del email de verificación |

### Flujo de Login

| ID | Requisito |
|----|-----------|
| RF-06 | El usuario puede hacer login con email y contraseña |
| RF-07 | Si el backend retorna `requires_2fa: true`, se redirige al paso de verificación TOTP |
| RF-08 | Tras login exitoso se redirige al dashboard (`/dashboard`) |
| RF-09 | Si la cuenta está bloqueada (API 429) se muestra tiempo de espera restante |
| RF-10 | Enlace "¿Olvidaste tu contraseña?" disponible en la página de login |

### Flujo de 2FA

| ID | Requisito |
|----|-----------|
| RF-11 | Página `/login/2fa` recibe el `temp_token` por estado de navegación (no URL) |
| RF-12 | El campo de código acepta solo 6 dígitos numéricos |
| RF-13 | Error claro si el código es incorrecto o expirado |

### Persistencia de Sesión

| ID | Requisito |
|----|-----------|
| RF-14 | El `access_token` se almacena en memoria (contexto React), nunca en localStorage |
| RF-15 | El `refresh_token` lo gestiona el servidor como HttpOnly cookie |
| RF-16 | Al recargar la página se intenta refresh silencioso antes de redirigir a login |
| RF-17 | El logout invalida el token en el servidor y limpia el estado local |

### Perfil y Contraseña

| ID | Requisito |
|----|-----------|
| RF-18 | El usuario puede ver y editar su nombre en `/profile` |
| RF-19 | El usuario puede cambiar su contraseña validando la actual |
| RF-20 | El usuario puede activar/desactivar 2FA desde el perfil |

### Credenciales

| ID | Requisito |
|----|-----------|
| RF-21 | El usuario puede ver la lista paginada de sus credenciales (nombre, tipo, username, fecha) |
| RF-22 | El usuario puede crear una credencial de tipo `ssh`, `git_https` o `git_ssh` |
| RF-23 | Al crear credencial tipo `ssh` con clave privada, se acepta texto PEM en un textarea |
| RF-24 | El usuario puede editar nombre, username, contraseña y clave privada de una credencial |
| RF-25 | El usuario puede eliminar una credencial; si tiene servidores asociados (API 409) se muestra error |
| RF-26 | La lista de credenciales nunca muestra `password` ni `private_key` |

### Servidores

| ID | Requisito |
|----|-----------|
| RF-27 | El usuario puede ver la lista paginada de sus servidores (nombre, tipo, estado, host) |
| RF-28 | El usuario puede registrar un servidor remoto (nombre, host, puerto, credencial, descripción) |
| RF-29 | El usuario puede registrar un servidor local (nombre, descripción) |
| RF-30 | Solo puede existir un servidor local por usuario; un segundo registro muestra error (API 409) |
| RF-31 | El usuario puede ver el detalle de un servidor |
| RF-32 | El usuario puede editar nombre, host, puerto, credencial y descripción de un servidor |
| RF-33 | El usuario puede eliminar un servidor; si está en uso (API 409) se muestra error descriptivo |
| RF-34 | El usuario puede habilitar o deshabilitar un servidor (toggle) |
| RF-35 | El usuario puede lanzar un health check y ver el resultado (latencia ms, OS detectado) |
| RF-36 | El usuario puede ejecutar un comando ad-hoc (`command`, `sudo`, `timeout`) en un servidor |
| RF-37 | El resultado del comando muestra `stdout`, `stderr` y `exit_code` en bloques diferenciados |
| RF-38 | Los servidores deshabilitados aparecen visualmente diferenciados (badge de estado) |

### Grupos de Servidores

| ID | Requisito |
|----|-----------|
| RF-39 | El usuario puede ver la lista de sus grupos (nombre, descripción, número de servidores) |
| RF-40 | El usuario puede crear un grupo con nombre, descripción y seleccionar servidores |
| RF-41 | El usuario puede editar nombre, descripción y miembros de un grupo |
| RF-42 | El usuario puede eliminar un grupo; si está vinculado a pipelines (API 409) se muestra error |
| RF-43 | Al seleccionar servidores en un grupo solo se ofrecen los servidores activos del usuario |

---

## Reglas No Funcionales (RNF)

### Seguridad

| ID | Requisito |
|----|-----------|
| RNF-01 | `access_token` NUNCA en localStorage ni sessionStorage — solo en memoria React |
| RNF-02 | Headers de seguridad configurados en `next.config.ts`: `CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| RNF-03 | Cookies del servidor con flags `HttpOnly`, `Secure`, `SameSite=Strict` |
| RNF-04 | Todas las entradas de usuario son sanitizadas antes de enviarse a la API |
| RNF-05 | El token no aparece en URLs, logs ni en el DOM |
| RNF-06 | Expiración proactiva: refresh automático 60s antes de que expire el `access_token` |

### Performance

| ID | Requisito |
|----|-----------|
| RNF-07 | LCP < 2.5s en conexión 4G simulada |
| RNF-08 | Código del formulario de login < 50KB (gzip) |
| RNF-09 | Los Server Components gestionan las rutas protegidas, no el cliente |
| RNF-10 | Sin waterfalls de datos: usar `Promise.all` para fetches paralelos cuando aplique |
| RNF-16 | Las listas paginadas de credenciales, servidores y grupos usan `page` y `per_page` como query params |
| RNF-17 | Las credenciales nunca exponen `password` ni `private_key` en ninguna respuesta del frontend |
| RNF-18 | Los resultados de comandos ad-hoc se muestran en `<pre>` con scroll horizontal y fuente monoespaciada |

### Accesibilidad

| ID | Requisito |
|----|-----------|
| RNF-11 | Todos los formularios tienen etiquetas `<label>` asociadas (`htmlFor`) |
| RNF-12 | Los mensajes de error son anunciados con `aria-live="polite"` |
| RNF-13 | Navegación completa por teclado (Tab, Enter, Escape) |
| RNF-14 | Contraste mínimo WCAG AA (4.5:1) |
| RNF-15 | Indicadores de carga accesibles (`aria-busy`, `aria-label` en spinners) |

---

## Reglas de Negocio (RN)

### Validación de Campos

| Campo | Regla |
|-------|-------|
| `name` | Requerido, 2-100 caracteres |
| `email` | Requerido, formato RFC 5322, lowercase antes de enviar |
| `password` | Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número |
| `code` (2FA) | Exactamente 6 dígitos numéricos |
| `new_password` | Mismas reglas que `password`, distinto a la contraseña actual |
| `name` (credential/server/group) | Requerido, 1-255 caracteres |
| `type` (credential) | Obligatorio, valor enum: `ssh` \| `git_https` \| `git_ssh` |
| `host` (server remoto) | Requerido para tipo `remote`, 1-255 caracteres |
| `port` (server) | Entero 1-65535, default 22 |
| `command` (ad-hoc) | Requerido, 1-2048 caracteres |
| `timeout` (ad-hoc) | Entero 1-600 segundos, default 30 |
| `server_ids` (group) | Lista de UUIDs válidos (puede ser vacía) |

### Manejo de Errores de API

| Código HTTP | Comportamiento en UI |
|-------------|----------------------|
| `401` | Credenciales inválidas — error genérico bajo el formulario (no revelar cuál campo) |
| `403` | Email no verificado / no propietario del recurso — banner o mensaje descriptivo |
| `404` | Recurso no encontrado — mensaje "No encontrado" + botón volver a la lista |
| `409` | Conflicto (email duplicado, en uso, solo un local) — mensaje descriptivo bajo el campo o como toast |
| `422` | Validación servidor — mapear errores al campo correspondiente |
| `429` | Rate limit — mensaje + temporizador de cuenta atrás |
| `503` | Error infra — toast de error con opción de reintentar |

### Estados de Carga

- **Formularios**: botón de submit deshabilitado + spinner inline mientras hay request en vuelo
- **Navegación**: barra de progreso en la parte superior (Next.js `useRouter` transition)
- **Refresh silencioso**: invisible para el usuario; en caso de fallo, redirect a `/login`

---

## Flujos Principales

### Registro → Verificación

```bash
/register → POST /auth/register → Página de confirmación "Revisa tu email"
                    ↑ (409) Error "email ya registrado"
```

### Login → Dashboard

```bash
/login → POST /auth/login
  ├── requires_2fa: false → /dashboard
  └── requires_2fa: true  → /login/2fa (con temp_token en estado)
                                └── POST /auth/login/2fa → /dashboard
```

### Refresh silencioso

```bash
App mount → GET /auth/refresh (cookie HttpOnly automática)
  ├── 200 → guardar access_token en memoria → renderizar app
  └── 401 → redirigir a /login
```
>>>>>>> origin/main
