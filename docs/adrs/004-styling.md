# ADR-004: Tailwind CSS v4 + shadcn/ui para Estilos y Componentes

**Fecha:** 2026-03-09
**Estado:** Aceptado

## Contexto

Necesitamos una solución de estilos que sea rápida de desarrollar, accesible por defecto y fácil de mantener sin un diseño system complejo propio.

## Decisión

**Tailwind CSS v4** para utilidades base + **shadcn/ui** para componentes de UI complejos (forms, dialogs, toasts).

## Argumentos

| Criterio | Tailwind + shadcn/ui | CSS Modules | Material UI |
|----------|----------------------|-------------|-------------|
| Bundle size | ✅ solo clases usadas | ✅ mínimo | ⚠️ ~100KB+ |
| Accesibilidad | ✅ Radix UI primitives | ❌ manual | ✅ integrada |
| Customización | ✅ total control | ✅ total | ⚠️ tema MUI |
| Time to market | ✅ rápido | ⚠️ lento | ✅ rápido |
| TypeScript | ✅ tipado completo | ✅ | ✅ |
| Dark mode | ✅ nativo (`dark:`) | ⚠️ manual | ✅ |

**Por qué shadcn/ui:** los componentes se copian al proyecto (no son una dependencia externa), lo que permite customización total. Están construidos sobre **Radix UI** que garantiza accesibilidad (ARIA, keyboard navigation) sin esfuerzo adicional.

## Consecuencias

- Los componentes de `shadcn/ui` viven en `src/components/ui/` y pueden modificarse libremente
- El tema (colores, radios, tipografía) se define en `tailwind.config.ts` como única fuente de verdad
- No se mezclan clases Tailwind con CSS-in-JS — solo Tailwind + CSS modules puntuales si necesario

## Alternativas descartadas

- **Material UI**: bundle grande, customización difícil, estética genérica
- **Chakra UI**: menos activo en 2026, peor integración con App Router
- **CSS puro / SCSS**: muy lento de desarrollar para un MVP
