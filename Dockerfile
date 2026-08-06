# Etapa 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias necesarias para better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generar cliente Prisma (el proveedor real viene de DATABASE_URL inyectada en build)
RUN npx prisma generate

# Build de Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Etapa 2: Runner (producción)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar dependencias para better-sqlite3 en runtime
RUN apk add --no-cache python3 make g++

# Copiar archivos necesarios del build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar Prisma, config, scripts, src y node_modules necesarios
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Crear directorios necesarios con permisos correctos
RUN mkdir -p /app/data && chmod 777 /app/data
RUN mkdir -p /app/public/uploads/comprobantes && chmod -R 777 /app/public/uploads
RUN chmod -R 777 /app/prisma

# Agregar node_modules/.bin al PATH
ENV PATH="/app/node_modules/.bin:$PATH"

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Script de inicio - prisma lee DATABASE_URL (Postgres en produccion) desde el entorno
CMD ["sh", "-c", "prisma migrate deploy && npx tsx prisma/seed.ts && node server.js"]
