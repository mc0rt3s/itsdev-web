import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkAuth(request);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const oportunidad = await prisma.oportunidad.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, razonSocial: true } },
        stage: true,
        pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
        actividades: { orderBy: { createdAt: 'desc' } },
        cotizacion: { select: { id: true, numero: true, estado: true, total: true } },
      },
    });
    if (!oportunidad) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json(oportunidad);
  } catch {
    return NextResponse.json({ error: 'Error al obtener oportunidad' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await request.json();
    const { stageId, titulo, monto, moneda, expectedCloseDate, closedAt, lostReason, source, cotizacionId } = data;

    // If moving to a stage, check if it's won/lost
    let closedAtValue = closedAt ? new Date(closedAt) : undefined;
    if (stageId) {
      const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
      if (stage && (stage.isWon || stage.isLost) && !closedAtValue) {
        closedAtValue = new Date();
      }
    }

    const oportunidad = await prisma.oportunidad.update({
      where: { id },
      data: {
        ...(stageId ? { stageId } : {}),
        ...(titulo !== undefined ? { titulo } : {}),
        ...(monto !== undefined ? { monto: monto ? Number(monto) : null } : {}),
        ...(moneda !== undefined ? { moneda } : {}),
        ...(expectedCloseDate !== undefined ? { expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null } : {}),
        ...(closedAtValue !== undefined ? { closedAt: closedAtValue } : {}),
        ...(lostReason !== undefined ? { lostReason } : {}),
        ...(source !== undefined ? { source } : {}),
        ...(cotizacionId !== undefined ? { cotizacionId } : {}),
      },
      include: {
        cliente: { select: { id: true, razonSocial: true } },
        stage: true,
      },
    });
    return NextResponse.json(oportunidad);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar oportunidad' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.oportunidad.delete({ where: { id } });
    return NextResponse.json({ message: 'Oportunidad eliminada' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar oportunidad' }, { status: 500 });
  }
}
