# ADR-005: Arquitectura Feature-Based y Capa de Servicios

**Fecha:** 2026-03-09  
**Estado:** Aceptado

## Contexto

Necesitamos una estructura de código que escale con el proyecto, evite el acoplamiento entre módulos y sea consistente con la Clean Architecture del backend.

## Decisión

Usamos **arquitectura orientada a features** dentro de `src/features/`, con una **capa de servicios tipada** que abstrae las llamadas al backend.

## Estructura

```
src/
├── app/                  # Next.js routing (solo layout + page)
├── features/
│   ├── auth/             # Todo lo de autenticación
│   │   ├── components/   # LoginForm, RegisterForm, TwoFactorForm
│   │   ├── services/     # authService.ts — llamadas a API
│   │   ├── hooks/        # useLogin, useRegister
│   │   ├── schemas/      # loginSchema.ts (Zod)
│   │   └── types.ts      # LoginFormValues, RegisterFormValues
│   └── profile/
├── components/ui/        # shadcn/ui components (compartidos)
├── lib/                  # apiClient.ts, utils.ts
├── contexts/             # AuthContext.tsx
└── types/                # Tipos globales compartidos
```

## Consecuencias

- Las `app/` pages son thin wrappers que importan de `features/`
- Los servicios son funciones puras tipadas (sin efectos secundarios directos), testeables
- Los hooks de React encapsulan el estado local y llaman a los servicios
- Nada de llamadas `fetch` directas en componentes — siempre via `apiClient`

## Alternativas descartadas

- **Por tipo** (`components/`, `hooks/`, `services/` globales): difícil de navegar al escalar
- **Monolítico en `app/`**: violar separación de concerns, dificulta tests de servicios
