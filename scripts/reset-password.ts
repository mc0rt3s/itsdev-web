/**
 * Script para resetear la contraseña de un usuario existente
 *
 * Uso:
 *   npx tsx scripts/reset-password.ts --email=admin@empresa.cl --password=nuevaClave123
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import { Pool } from 'pg';

function createPrismaAdapter() {
  const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
  console.log('Conectando a:', dbUrl);

  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return new PrismaPg(new Pool({ connectionString: dbUrl }));
  }

  return new PrismaBetterSqlite3({ url: dbUrl });
}

const adapter = createPrismaAdapter();
const prisma = new PrismaClient({ adapter });

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) args[match[1]] = match[2];
  });
  return args;
}

async function main() {
  const args = parseArgs();
  const email = args.email;
  const password = args.password;

  if (!email || !password) {
    console.error('❌ Uso: npx tsx scripts/reset-password.ts --email=xxx --password=yyy');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ La contraseña debe tener al menos 6 caracteres');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ No existe usuario con email: ${email}`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

  console.log(`✅ Contraseña actualizada para ${email} (${user.name} / ${user.role})`);
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
