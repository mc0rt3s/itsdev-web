import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

const DEFAULTS: Record<string, number> = {
  tipoCambioUSD: 924,
  tipoCambioUF: 35850,
  tipoCambioUTM: 50000,
};

// GET - Obtener valores actuales (tipo de cambio, etc.)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const configs = await prisma.configValor.findMany({
      where: { clave: { in: Object.keys(DEFAULTS) } },
    });

    const result: Record<string, number> = { ...DEFAULTS };
    configs.forEach((c) => {
      const num = parseFloat(c.valor);
      if (!isNaN(num)) result[c.clave] = num;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al obtener valores:', error);
    return NextResponse.json({ error: 'Error al obtener valores' }, { status: 500 });
  }
}

// PUT - Actualizar valores
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const data = (await request.json()) as Record<string, number>;
    const validKeys = Object.keys(DEFAULTS);

    for (const clave of validKeys) {
      if (typeof data[clave] === 'number' && !isNaN(data[clave])) {
        await prisma.configValor.upsert({
          where: { clave },
          create: { clave, valor: String(data[clave]) },
          update: { valor: String(data[clave]) },
        });
      }
    }

    const configs = await prisma.configValor.findMany({
      where: { clave: { in: validKeys } },
    });
    const result: Record<string, number> = { ...DEFAULTS };
    configs.forEach((c) => {
      const num = parseFloat(c.valor);
      if (!isNaN(num)) result[c.clave] = num;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al actualizar valores:', error);
    return NextResponse.json({ error: 'Error al actualizar valores' }, { status: 500 });
  }
}
