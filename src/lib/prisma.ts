import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// PostgreSQL es la única base (local y producción). DATABASE_URL obligatorio.
export function createPrismaAdapter() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !/^postgres(ql)?:\/\//.test(dbUrl)) {
    throw new Error('DATABASE_URL debe ser postgresql://... (ver .env.example)');
  }
  return new PrismaPg(new Pool({ connectionString: dbUrl }));
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
