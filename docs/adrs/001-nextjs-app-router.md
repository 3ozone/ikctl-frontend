# ADR-001: Next.js App Router con TypeScript

**Fecha:** 2026-03-09
**Estado:** Aceptado

## Contexto

Necesitamos elegir el framework y paradigma de renderizado para el frontend de ikctl. El backend ya está implementado con FastAPI (async, REST). El frontend necesita manejar autenticación, SSR para rutas protegidas y una arquitectura mantenible a largo plazo.

## Decisión

Usamos **Next.js 15 con App Router** y **TypeScript estricto**.

## Argumentos

| Criterio | App Router (elegido) | Pages Router |
|----------|----------------------|--------------|
| Server Components | ✅ nativo | ❌ solo client |
| Autenticación en servidor | ✅ middleware + cookies HttpOnly | ⚠️ manual |
| Streaming / Suspense | ✅ integrado | ❌ limitado |
| Layouting anidado | ✅ layout.tsx jerárquico | ⚠️ manual _app |
| Madurez (2026) | ✅ estable, LTS | ✅ legacy estable |

**Por qué no Remix / SvelteKit / Nuxt:** el ecosistema del equipo es React; Next.js tiene el mejor soporte de autenticación server-side y la mayor compatibilidad con las librerías React existentes.

## Consecuencias

- Las rutas protegidas se verifican en `middleware.ts` (edge) con la cookie de sesión
- Los formularios de auth son Client Components (`"use client"`) para interactividad
- Los datos del perfil se cargan con Server Components (no exponen el token al cliente)

## Alternativas descartadas

- **Pages Router**: requeriría `getServerSideProps` en cada ruta protegida — más verbose
- **Vite + React SPA**: sin SSR, menos seguro para manejar tokens; requiere proxy separado
