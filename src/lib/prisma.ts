import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';
import { Pool } from 'pg';

// Detectar si DATABASE_URL apunta a PostgreSQL o SQLite y crear el adapter adecuado.
// - PostgreSQL: DATABASE_URL tipo postgresql://... (producción, Supabase)
// - SQLite: DATABASE_URL tipo file:... (desarrollo local)
export function createPrismaAdapter() {
  const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;

  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return new PrismaPg(new Pool({ connectionString: dbUrl }));
  }

  return new PrismaBetterSqlite3({ url: dbUrl });
}

function createPrismaClient() {
  const adapter = createPrismaAdapter();
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
