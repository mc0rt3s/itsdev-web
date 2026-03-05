import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { clockifyTaskTipoSchema } from '@/lib/schemas';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    const data = await request.json();
    const validation = clockifyTaskTipoSchema.safeParse(data);
    if (!validation.success)
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

    const existing = await prisma.clockifyTaskTipo.findFirst({
      where: {
        clockifyTaskId: validation.data.clockifyTaskId,
        NOT: { id },
      },
    });
    if (existing)
      return NextResponse.json(
        { error: 'Ya existe otro registro para esta tarea de Clockify' },
        { status: 400 }
      );

    const updated = await prisma.clockifyTaskTipo.update({
      where: { id },
      data: {
        clockifyProjectId: validation.data.clockifyProjectId ?? null,
        nombre: validation.data.nombre,
        tipoHora: validation.data.tipoHora,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al actualizar tipo de tarea Clockify:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.clockifyTaskTipo.delete({ where: { id } });
    return NextResponse.json({ message: 'Eliminado' });
  } catch (error) {
    console.error('Error al eliminar tipo de tarea Clockify:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
