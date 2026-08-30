/**
 * Script para crear usuarios desde la línea de comandos
 * 
 * Uso:
 *   npx tsx scripts/create-user.ts
 * 
 * O con argumentos:
 *   npx tsx scripts/create-user.ts --email=admin@empresa.cl --name="Admin" --password=secret123 --role=admin
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import * as readline from 'readline';
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

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = parseArgs();

  // Si todos los parámetros están en args, usarlos directamente
  if (args.email && args.name && args.password && args.role) {
    const { email, name, password, role } = args;

    if (password.length < 6) {
      console.error('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`❌ Ya existe usuario con email: ${email}`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: role as any },
    });

    console.log(`✅ Usuario creado: ${user.email} (${user.name} / ${user.role})`);
    return;
  }

  // Modo interactivo
  console.log('📝 Crear nuevo usuario\n');

  const email = await promptUser('Email: ');
  if (!email) {
    console.error('❌ Email requerido');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`❌ Ya existe usuario con email: ${email}`);
    process.exit(1);
  }

  const name = await promptUser('Nombre: ');
  if (!name) {
    console.error('❌ Nombre requerido');
    process.exit(1);
  }

  const password = await promptUser('Contraseña: ');
  if (!password || password.length < 6) {
    console.error('❌ Contraseña requerida (mín 6 caracteres)');
    process.exit(1);
  }

  const role = await promptUser('Rol (admin/user) [admin]: ');
  const finalRole = role || 'admin';

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword, role: finalRole as any },
  });

  console.log(`\n✅ Usuario creado: ${user.email} (${user.name} / ${user.role})`);
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
