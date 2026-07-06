import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Usuario administrador principal
  const existing = await prisma.user.findUnique({ where: { email: 'marcelo@itsdev.cl' } });

  if (existing) {
    console.log('✓ Usuario marcelo@itsdev.cl ya existe');
  } else {
    const hashedPassword = await bcrypt.hash('Itsdev2026!', 12);
    await prisma.user.create({
      data: {
        email: 'marcelo@itsdev.cl',
        name: 'Marcelo Cortés',
        password: hashedPassword,
        role: 'admin',
      },
    });
    console.log('✅ Usuario creado:');
    console.log('   Email:    marcelo@itsdev.cl');
    console.log('   Password: Itsdev2026!');
    console.log('   Rol:      admin');
  }

  // Pipeline CRM
  const existingPipeline = await prisma.pipeline.findFirst();
  if (!existingPipeline) {
    const pipeline = await prisma.pipeline.create({ data: { name: 'Principal' } });

    const stages = [
      { name: 'Prospecto',   color: '#64748b', order: 0, probability: 10,  isWon: false, isLost: false },
      { name: 'Contactado',  color: '#3b82f6', order: 1, probability: 25,  isWon: false, isLost: false },
      { name: 'Propuesta',   color: '#8b5cf6', order: 2, probability: 50,  isWon: false, isLost: false },
      { name: 'Negociación', color: '#f59e0b', order: 3, probability: 75,  isWon: false, isLost: false },
      { name: 'Ganada',      color: '#10b981', order: 4, probability: 100, isWon: true,  isLost: false },
      { name: 'Perdida',     color: '#ef4444', order: 5, probability: 0,   isWon: false, isLost: true  },
    ];

    for (const s of stages) {
      await prisma.pipelineStage.create({ data: { ...s, pipelineId: pipeline.id } });
    }
    console.log('✅ Pipeline CRM creado con 6 etapas');
  } else {
    console.log('✓ Pipeline CRM ya existe');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
