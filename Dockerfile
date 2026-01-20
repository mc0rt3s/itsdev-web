# Etapa 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias necesarias para better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generar cliente Prisma
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

# Copiar Prisma, config y node_modules necesarios
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Crear directorio para la base de datos con permisos correctos
RUN mkdir -p /app/data && chmod 777 /app/data
RUN chmod -R 777 /app/prisma

# Agregar node_modules/.bin al PATH
ENV PATH="/app/node_modules/.bin:$PATH"

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"

# Script de inicio - pasar URL explícitamente con --url flag
CMD ["sh", "-c", "prisma migrate deploy --url \"$DATABASE_URL\" && node server.js"]
