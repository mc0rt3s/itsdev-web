import { defineConfig } from '@prisma/internals';
import path from 'path';

/**
 * Prisma ORM v7 configuration
 * Soporta múltiples adapters (PostgreSQL + SQLite)
 * - Production: PostgreSQL vía Supabase/Railway
 * - Development: SQLite local
 */
export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
