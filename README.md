# itsdev-web

Plataforma web de ItsDev construida con Next.js (App Router), Prisma y SQLite.
Incluye sitio público, panel admin, CRM básico, facturación, cotizaciones, gastos e integraciones (Resend, Calendly, Clockify).

## Stack

- Next.js 16 + React 19 + TypeScript
- Prisma 7 + SQLite (`better-sqlite3`)
- NextAuth v5 (credenciales)
- Tailwind CSS 4

## Módulos principales

- Sitio público (`/`)
- Panel admin (`/admin`)
- Clientes, accesos, notas, enlaces, proyectos, tareas
- Facturas, cotizaciones, suscripciones, comunicaciones
- Gastos + dashboard de flujo de caja
- Integraciones:
  - Resend (emails)
  - Calendly (eventos)
  - Clockify (reportes de horas)

## Requisitos

- Node.js 22+
- npm 10+

## Variables de entorno

Usa `.env.example` como base.

Variables relevantes:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `RESEND_API_KEY`
- `CALENDLY_API_TOKEN`
- `CLOCKIFY_API_KEY`
- `NEXT_PUBLIC_CALENDLY_URL`
- `NEXT_PUBLIC_GOOGLE_VERIFICATION`

## Desarrollo

```bash
npm ci
npm run dev
```

## Calidad

```bash
npm run lint
npm run test
```

## Base de datos

```bash
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Crear usuario inicial

```bash
npm run user:create
```

## Seguridad (actual)

- Endpoints admin protegidos por sesión (`auth()`)
- Endpoint sensible de informe de accesos protegido por:
  - autenticación
  - rol `admin`
  - rate limiting por usuario
- Validación de payloads con Zod en rutas críticas
- Headers de seguridad HTTP globales (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
- Auditoría persistente en BD (`AuditLog`) para acciones sensibles

## Auditoría y migraciones

Antes de usar auditoría en un entorno existente, aplica migraciones:

```bash
npm run db:migrate
```

## Deploy

Ver [`DEPLOY.md`](./DEPLOY.md).
