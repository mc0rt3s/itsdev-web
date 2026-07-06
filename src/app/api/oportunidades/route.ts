import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const ok = await checkAuth(request);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId');
  const clienteId = searchParams.get('clienteId');
  const open = searchParams.get('open'); // 'true' = exclude won/lost

  try {
    const stages = open === 'true'
      ? await prisma.pipelineStage.findMany({ where: { isWon: false, isLost: false }, select: { id: true } })
      : null;

    const oportunidades = await prisma.oportunidad.findMany({
      where: {
        ...(stageId ? { stageId } : {}),
        ...(clienteId ? { clienteId } : {}),
        ...(stages ? { stageId: { in: stages.map(s => s.id) } } : {}),
      },
      include: {
        cliente: { select: { id: true, razonSocial: true } },
        stage: { select: { id: true, name: true, color: true, isWon: true, isLost: true, probability: true } },
        cotizacion: { select: { id: true, numero: true, estado: true } },
        actividades: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { actividades: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(oportunidades);
  } catch {
    return NextResponse.json({ error: 'Error al obtener oportunidades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const data = await request.json();
    const { clienteId, pipelineId, stageId, titulo, monto, moneda, expectedCloseDate, source } = data;

    if (!clienteId || !stageId || !titulo) {
      return NextResponse.json({ error: 'clienteId, stageId y titulo son requeridos' }, { status: 400 });
    }

    const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage) return NextResponse.json({ error: 'Etapa no encontrada' }, { status: 404 });

    const oportunidad = await prisma.oportunidad.create({
      data: {
        clienteId,
        pipelineId: pipelineId || stage.pipelineId,
        stageId,
        titulo,
        monto: monto ? Number(monto) : null,
        moneda: moneda || 'CLP',
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        source: source || null,
      },
      include: {
        cliente: { select: { id: true, razonSocial: true } },
        stage: true,
      },
    });
    return NextResponse.json(oportunidad, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear oportunidad' }, { status: 500 });
  }
}
