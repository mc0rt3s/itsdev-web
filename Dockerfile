# Etapa 1: Build
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generar cliente Prisma antes del build
RUN npx prisma generate || true

# Build de Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"
RUN npm run build

# Etapa 2: Runner (producción)
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar archivos necesarios del build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copiar Prisma, config, scripts, src y node_modules necesarios
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Directorio de subidas: único que la app escribe en runtime (la BD es PostgreSQL externa).
# Se chown a node para no usar chmod 777 ni ejecutar como root.
RUN mkdir -p /app/public/uploads/comprobantes \
    && chown -R node:node /app/public \
    && chown node:node /app

# Ejecutar como usuario no-root
ENV HOME=/app
USER node

# Agregar node_modules/.bin al PATH
ENV PATH="/app/node_modules/.bin:$PATH"

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Solo arranca Next. Migraciones/schema se aplican fuera del contenedor (ver DEPLOY.md).
CMD ["next", "start"]
