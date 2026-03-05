import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Listar proveedores usados previamente (para autocompletado)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const gastos = await prisma.gasto.findMany({
      where: { proveedor: { not: null } },
      select: { proveedor: true },
    });

    const proveedores = [...new Set(gastos.map((g) => g.proveedor).filter((p): p is string => !!p && p.trim() !== ''))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );

    return NextResponse.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}
