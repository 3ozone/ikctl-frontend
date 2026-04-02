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
- [ ] **T-57**: Páginas `(dashboard)/credentials/page.tsx` — composición lista + form + delete confirmation (RF-25) ⛔
- [ ] **T-58**: TypeCheck + lint pass (`tsc --noEmit && eslint`) ⛔

---

## Fase 9: Feature Servers

- [ ] **T-59**: Schemas Zod — `registerServerSchema` (remote), `registerLocalServerSchema`, `updateServerSchema`, `adHocCommandSchema` con validaciones de RN ⛔
- [ ] **T-60**: Types TS — añadir `ServerResponse`, `ServerListResponse`, `HealthCheckResponse`, `AdHocCommandResponse` en `types/api.ts` ⛔
- [ ] **T-61**: `serversService.ts` — `list`, `get`, `create` (remote/local discriminador), `update`, `delete`, `toggle`, `health`, `command` (RF-27 a RF-38) ⛔
- [ ] **T-62**: Hooks — `useServers`, `useCreateServer`, `useUpdateServer`, `useDeleteServer`, `useToggleServer`, `useServerHealth`, `useAdHocCommand` ⛔
- [ ] **T-63**: `ServersList.tsx` — tabla paginada con badge de estado/tipo, servidores deshabilitados diferenciados (RF-27, RF-38) ⛔
- [ ] **T-64**: `RegisterServerForm.tsx` — formulario con discriminador local/remote (muestra/oculta campos según tipo) (RF-28, RF-29, RF-30) ⛔
- [ ] **T-65**: `ServerDetail.tsx` + `ServerHealthCard.tsx` + `AdHocCommandPanel.tsx` — detalle + health check + ejecución con salida `<pre>` (RF-31, RF-35, RF-36, RF-37, RNF-18) ⛔
- [ ] **T-66**: Páginas `(dashboard)/servers/page.tsx` + `(dashboard)/servers/[id]/page.tsx` ⛔
- [ ] **T-67**: TypeCheck + lint pass ⛔

---

## Fase 10: Feature Groups

- [ ] **T-68**: Schema Zod `groupSchema` — `name`, `description`, `server_ids` con validaciones de RN ⛔
- [ ] **T-69**: Types TS — añadir `GroupResponse`, `GroupListResponse` en `types/api.ts` ⛔
- [ ] **T-70**: `groupsService.ts` — `list`, `get`, `create`, `update`, `delete` ⛔
- [ ] **T-71**: Hooks — `useGroups`, `useCreateGroup`, `useUpdateGroup`, `useDeleteGroup` ⛔
- [ ] **T-72**: `GroupsList.tsx` — tabla paginada (nombre, descripción, nº servidores) (RF-39) ⛔
- [ ] **T-73**: `GroupForm.tsx` — formulario create/edit con multi-select de servidores activos del usuario (RF-40, RF-41, RF-43) ⛔
- [ ] **T-74**: Página `(dashboard)/groups/page.tsx` — lista + form + delete con error 409 (RF-42) ⛔
- [ ] **T-75**: TypeCheck + lint pass ⛔
