# ADR-006: Patrones de UI para el Módulo Servers

**Fecha:** 2026-03-10  
**Estado:** Aceptado

## Contexto

El módulo `servers` expone tres recursos (credenciales, servidores, grupos) con 18 endpoints CRUD + operaciones especiales (toggle, health check, comando ad-hoc). Necesitamos decidir:

1. **Layout de listas**: tabla vs tarjetas (cards)
2. **Formularios**: página dedicada vs modal/dialog
3. **Paginación**: cliente vs servidor
4. **Estado async**: polling, refetch-on-focus, o fetch manual

## Decisiones

### 1. Tablas para listas con paginación server-side

Usamos `<table>` (con componentes shadcn/ui `Table`) para credenciales, servidores y grupos:

- **Razón**: los tres recursos tienen atributos tabulares (nombre, tipo, estado, fecha). Una tabla permite comparar filas y escaneado rápido. Las tarjetas (cards) son preferibles para recursos con imagen o descripción larga, que no aplica aquí.
- **Paginación**: parámetros `page` y `per_page` enviados al backend. El componente recibe `total`, `page`, `per_page` y renderiza controles Prev/Next.
- **No infinite-scroll**: la paginación clásica es más accesible y predecible para gestión de infraestructura.

### 2. Dialogs (modales) para formularios de creación/edición

Usamos `shadcn/ui Dialog` para los formularios create/edit de los tres recursos:

- **Razón**: los formularios son cortos (≤ 6 campos) y no requieren página dedicada. Los modales preservan el contexto de la lista en segundo plano.
- **Excepción**: el panel de ejecución de comando ad-hoc y el detalle del servidor sí usan página dedicada (`/servers/[id]`) porque agrupan múltiples secciones (detalle + health + terminal).

### 3. Fetch manual (sin polling ni SWR)

No usamos TanStack Query, SWR ni polling automático:

- **Razón YAGNI**: los datos de servidores no cambian en tiempo real desde el punto de vista del usuario. Un refetch explícito al abrir la página o tras cada mutación es suficiente.
- **Patrón**: hooks con `useState` + `useEffect` (fetch al montar y tras cada mutación). Si en el futuro se necesita reactividad tiempo-real, se evalúa migrar a TanStack Query.

### 4. Discriminador local/remote en el formulario de servidor

El formulario de registro de servidor usa un campo `type` (radio o select) que muestra/oculta campos:

- **remote**: muestra `host`, `port`, `credential_id`
- **local**: oculta esos campos

Implementado con `watch('type')` de `react-hook-form`.

## Consecuencias

- Las páginas de lista (`/credentials`, `/servers`, `/groups`) son thin wrappers con tabla + dialog + paginación.
- El estado de los dialogs (abierto/cerrado, item en edición) vive en el componente de página.
- No se introduce ninguna librería nueva de gestión de estado — se reutiliza el patrón existente (hooks con `useState`).

## Alternativas descartadas

- **Cards**: menos densidad de información, innecesario para recursos de infraestructura.
- **Páginas dedicadas para create/edit**: más navegación, más complejo, innecesario para formularios cortos.
- **TanStack Query**: over-engineering para el volumen y frecuencia de actualización actuales.
- **Polling**: consume recursos del backend innecesariamente; el health check es on-demand.
