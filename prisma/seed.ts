import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Verificar si ya existe un admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@itsdev.cl' },
  });

  if (existingAdmin) {
    console.log('⚠️  El usuario admin ya existe');
    return;
  }

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  await prisma.user.create({
    data: {
      email: 'admin@itsdev.cl',
      name: 'Administrador',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Usuario admin creado:');
  console.log('   Email: admin@itsdev.cl');
  console.log('   Password: admin123');
  console.log('   (¡Cambia la contraseña después de iniciar sesión!)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
