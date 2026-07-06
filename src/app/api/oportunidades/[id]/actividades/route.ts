import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkAuth(request);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const actividades = await prisma.actividad.findMany({
      where: { oportunidadId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(actividades);
  } catch {
    return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await request.json();
    const { tipo, asunto, notas, scheduledAt, completedAt, nextActionDate } = data;
    if (!tipo || !asunto) return NextResponse.json({ error: 'tipo y asunto son requeridos' }, { status: 400 });

    // Also get the clienteId from the oportunidad
    const oportunidad = await prisma.oportunidad.findUnique({ where: { id }, select: { clienteId: true } });

    const actividad = await prisma.actividad.create({
      data: {
        oportunidadId: id,
        clienteId: oportunidad?.clienteId || null,
        tipo,
        asunto,
        notas: notas || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
      },
    });
    return NextResponse.json(actividad, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear actividad' }, { status: 500 });
  }
}
