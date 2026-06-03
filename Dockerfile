# ============================================================
# Stage 1: deps — instala dependencias de producción y dev
# ============================================================
FROM node:20-alpine AS deps

# Necesario para binarios nativos en Alpine (sharp, bcrypt, etc.)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar solo manifiestos para aprovechar la caché de capas
COPY package.json package-lock.json ./

# Instalación reproducible y limpia
RUN npm ci

# ============================================================
# Stage 2: builder — compila la aplicación Next.js
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar el código fuente completo
COPY . .

# NEXT_PUBLIC_* se incrustan en el bundle durante el build —
# hay que pasarlos como ARG/ENV antes de ejecutar `npm run build`.
# El valor por defecto apunta al host del desarrollador; en CI/CD
# se sobreescribe con la URL real del backend.
ARG NEXT_PUBLIC_API_URL=http://localhost:8089/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Desactivar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 3: runner — imagen final mínima con standalone output
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Usuario sin privilegios — buena práctica de seguridad
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Archivos públicos estáticos
COPY --from=builder /app/public ./public

# El modo standalone genera un servidor Node.js autocontenido
# con solo las dependencias mínimas necesarias para ejecutar la app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# server.js generado por Next.js standalone
CMD ["node", "server.js"]
