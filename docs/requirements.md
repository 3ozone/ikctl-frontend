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
