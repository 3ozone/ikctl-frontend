# ADR-002: React Hook Form + Zod para Validación de Formularios

**Fecha:** 2026-03-09
**Estado:** Aceptado

## Contexto

Los formularios de auth (register, login, change-password) tienen validación compleja: contraseñas con reglas de complejidad, código TOTP de exactamente 6 dígitos, errores procedentes del servidor que deben mapearse al campo correspondiente.

## Decisión

Usamos **React Hook Form (RHF) v7** + **Zod v3** para validación.

## Argumentos

| Criterio | RHF + Zod | Formik + Yup |  HTML5 nativo |
|----------|-----------|--------------|----------------|
| Re-renders | ✅ mínimos (uncontrolled) | ⚠️ muchos (controlled) | ✅ ninguno |
| TypeScript inference | ✅ `z.infer<typeof schema>` | ⚠️ manual | ❌ ninguna |
| Errores de servidor | ✅ `setError()` por campo | ✅ `setFieldError()` | ❌ manual |
| Bundle size | ✅ ~10KB | ⚠️ ~30KB | ✅ 0KB |
| Composición de schemas | ✅ `.merge()`, `.pick()`, `.extend()` | ⚠️ limitada | ❌ |

**Patrón clave:** los schemas Zod son la única fuente de verdad del tipo de datos de formulario. El mismo schema valida en cliente y puede reutilizarse en tests.

```typescript
// Definición única — type inferido automáticamente
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
})
type LoginFormValues = z.infer<typeof loginSchema>
```

## Consecuencias

- Los tipos de los formularios se derivan de Zod, no se definen dos veces
- Los errores de API (422) se mapean a campos con `form.setError("email", { message: "..." })`
- No se usa estado local (`useState`) para valores de formulario — todo via RHF

## Alternativas descartadas

- **Formik**: más verboso, más re-renders, bundle mayor
- **TanStack Form**: muy nuevo, documentación más pobre, menor ecosistema
- **HTML5 nativo**: no tiene inferencia de tipos ni validación reutilizable en tests
