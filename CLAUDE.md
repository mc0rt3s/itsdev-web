# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (standalone output)
npm run lint         # ESLint
npm run test         # Run all tests (Node test runner, no Jest)

# Single test file
node --experimental-strip-types --test tests/rate-limit.test.ts

# Database
npm run db:migrate   # Apply pending migrations (prisma migrate deploy)
npm run db:seed      # Seed data
npm run db:studio    # Prisma Studio

npm run user:create  # Create initial admin user
```

## Architecture

**Stack:** Next.js 16 App Router + React 19 + TypeScript, Prisma 7 + PostgreSQL (`@prisma/adapter-pg`), NextAuth v5, Tailwind CSS 4.

**Two surfaces in one app:**
- `src/app/` (public) — marketing site at `/`, contact form, Calendly widgets
- `src/app/admin/` — protected panel (login at `/login`)

**API routes** live under `src/app/api/` and mirror the admin sections: `clientes`, `accesos`, `notas`, `enlaces`, `proyectos`, `tareas`, `facturas`, `cotizaciones`, `suscripciones`, `comunicaciones`, `gastos`, `servicios`, `usuarios`, `uploads`. Plus integrations: `calendly`, `clockify`, `contact`.

**Auth pattern** — use `requireAuth()` from `src/lib/api.ts` in every API route. It accepts two auth methods:
1. NextAuth session (web UI)

Role check: `requireAuth({ roles: ['admin'] })`. Returns `{ session }` on success or `{ response }` to return early.

**Zod validation** — call `parseJsonBody(request, schema)` from `src/lib/api.ts` after `requireAuth`. All schemas are centralized in `src/lib/schemas.ts`.

**Prisma client** — singleton in `src/lib/prisma.ts` using `@prisma/adapter-pg`. Local and production both use PostgreSQL via `DATABASE_URL` (local: `postgresql://postgres@127.0.0.1:5432/itsdev_web`). Schema provider is `postgresql`. SQLite is no longer used.

**Rate limiting** — in-memory via `src/lib/rate-limit.ts`. Used on sensitive endpoints (e.g., access report emails).

**Audit logging** — `writeAuditLog()` from `src/lib/audit.ts` writes to `AuditLog` table for sensitive actions.

**BaseAPI integration** (`src/lib/baseapi.ts`) — Chilean SII (tax authority) e-invoicing. Configured via `BASEAPI_*` env vars. `afectaIva: true` emits `factura`, false emits `factura-exenta`. Has automatic retry logic for transient navigation errors.

**PDF generation** — `src/lib/pdf-generator.ts` using jsPDF. Logo loaded from `public/logo-pdf.png` (base64 at runtime).

**Deploy** — Coolify (server `ItsDev-apps`) with Docker, `output: 'standalone'`. Production DB is Coolify PostgreSQL `postgresql-itsdev-web-db`. Container CMD runs `prisma migrate deploy && node server.js`.

## Key env vars

```
DATABASE_URL          # PostgreSQL connection string (local and production)
NEXTAUTH_SECRET
NEXTAUTH_URL
RESEND_API_KEY        # Email sending
CALENDLY_API_TOKEN
CLOCKIFY_API_KEY
BASEAPI_API_KEY       # SII e-invoicing
BASEAPI_RUT / BASEAPI_PASSWORD / BASEAPI_CLAVE_CERTIFICADO
BASEAPI_RUT_EMPRESA / BASEAPI_AMBIENTE  # sandbox | produccion
NEXT_PUBLIC_CALENDLY_URL
NEXT_PUBLIC_GOOGLE_VERIFICATION
```

## Tests

Tests use Node's built-in test runner (`node:test` + `node:assert/strict`), not Jest. Files are in `tests/` with `.test.ts` extension. No mocking framework — utilities expose a `clearXForTest()` reset function for state isolation between tests.
