import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await request.json();
    const actividad = await prisma.actividad.update({
      where: { id },
      data: {
        ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
        ...(data.asunto !== undefined ? { asunto: data.asunto } : {}),
        ...(data.notas !== undefined ? { notas: data.notas } : {}),
        ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt ? new Date(data.completedAt) : null } : {}),
        ...(data.nextActionDate !== undefined ? { nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null } : {}),
      },
    });
    return NextResponse.json(actividad);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar actividad' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.actividad.delete({ where: { id } });
    return NextResponse.json({ message: 'Actividad eliminada' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar actividad' }, { status: 500 });
  }
}
