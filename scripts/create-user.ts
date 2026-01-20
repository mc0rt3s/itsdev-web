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
import bcrypt from 'bcryptjs';
import path from 'path';
import * as readline from 'readline';

// Configurar Prisma
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  });
  return args;
}

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden) {
      process.stdout.write(question);
      let input = '';
      
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      const onData = (char: string) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007F') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(question + '*'.repeat(input.length));
          }
        } else {
          input += char;
          process.stdout.write('*');
        }
      };
      
      process.stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function main() {
  console.log();
  log('╔═══════════════════════════════════════════════════╗', colors.cyan);
  log('║        🔐 CREAR USUARIO - itsDev Admin            ║', colors.cyan);
  log('╚═══════════════════════════════════════════════════╝', colors.cyan);
  console.log();

  const args = parseArgs();
  
  // Obtener datos del usuario
  let email = args.email;
  let name = args.name;
  let password = args.password;
  let role = args.role;

  if (!email) {
    email = await prompt(`${colors.bright}Email: ${colors.reset}`);
  }

  if (!name) {
    name = await prompt(`${colors.bright}Nombre: ${colors.reset}`);
  }

  if (!password) {
    password = await prompt(`${colors.bright}Contraseña: ${colors.reset}`, true);
  }

  if (!role) {
    const roleInput = await prompt(`${colors.bright}Rol (admin/user) [user]: ${colors.reset}`);
    role = roleInput === 'admin' ? 'admin' : 'user';
  }

  // Validaciones
  if (!email || !email.includes('@')) {
    log('\n❌ Email inválido', colors.red);
    process.exit(1);
  }

  if (!name || name.trim().length < 2) {
    log('\n❌ Nombre inválido (mínimo 2 caracteres)', colors.red);
    process.exit(1);
  }

  if (!password || password.length < 6) {
    log('\n❌ Contraseña inválida (mínimo 6 caracteres)', colors.red);
    process.exit(1);
  }

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    log(`\n❌ Ya existe un usuario con el email: ${email}`, colors.red);
    process.exit(1);
  }

  // Crear usuario
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
    },
  });

  console.log();
  log('╔═══════════════════════════════════════════════════╗', colors.green);
  log('║            ✅ USUARIO CREADO EXITOSAMENTE         ║', colors.green);
  log('╚═══════════════════════════════════════════════════╝', colors.green);
  console.log();
  log(`  📧 Email:    ${user.email}`, colors.reset);
  log(`  👤 Nombre:   ${user.name}`, colors.reset);
  log(`  🔑 Rol:      ${user.role === 'admin' ? 'Administrador' : 'Usuario'}`, colors.reset);
  log(`  📅 Creado:   ${user.createdAt.toLocaleString('es-CL')}`, colors.reset);
  console.log();
  log('  ⚠️  Guarda la contraseña en un lugar seguro', colors.yellow);
  console.log();
}

main()
  .catch((error) => {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
