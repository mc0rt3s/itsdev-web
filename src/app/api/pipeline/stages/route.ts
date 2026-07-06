import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const ok = await checkAuth(request);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { oportunidades: true } } },
    });
    return NextResponse.json(stages);
  } catch {
    return NextResponse.json({ error: 'Error al obtener etapas' }, { status: 500 });
  }
}
