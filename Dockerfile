# Etapa 1: Build
FROM node:24-alpine AS builder
WORKDIR /app

# Instalar dependencias necesarias para better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build de Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"
RUN npm run build

# Etapa 2: Runner (producción)
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar dependencias para better-sqlite3 en runtime
RUN apk add --no-cache python3 make g++

# Copiar archivos necesarios del build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copiar Prisma, config, scripts, src y node_modules necesarios
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Directorio de subidas: único que la app escribe en runtime (la BD es Postgres).
# Se chown a node para no usar chmod 777 ni ejecutar como root.
RUN mkdir -p /app/public/uploads/comprobantes \
    && chown -R node:node /app/public \
    && chown node:node /app

# Ejecutar como usuario no-root (node ya existe en node:20-alpine)
ENV HOME=/app
USER node

# Agregar node_modules/.bin al PATH
ENV PATH="/app/node_modules/.bin:$PATH"

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Script de inicio - ejecutar Next.js (sin db push para agilizar startup)
CMD ["next", "start"]
