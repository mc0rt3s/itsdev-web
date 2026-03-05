import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { clockifyTaskTipoSchema } from '@/lib/schemas';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const list = await prisma.clockifyTaskTipo.findMany({
      orderBy: [{ nombre: 'asc' }],
    });
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error al listar tipos de tarea Clockify:', error);
    return NextResponse.json({ error: 'Error al listar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const data = await request.json();
    const validation = clockifyTaskTipoSchema.safeParse(data);
    if (!validation.success)
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

    const existing = await prisma.clockifyTaskTipo.findUnique({
      where: { clockifyTaskId: validation.data.clockifyTaskId },
    });
    if (existing)
      return NextResponse.json(
        { error: 'Ya existe un tipo de hora para esta tarea de Clockify' },
        { status: 400 }
      );

    const created = await prisma.clockifyTaskTipo.create({
      data: {
        clockifyTaskId: validation.data.clockifyTaskId,
        clockifyProjectId: validation.data.clockifyProjectId ?? null,
        nombre: validation.data.nombre,
        tipoHora: validation.data.tipoHora,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error al crear tipo de tarea Clockify:', error);
    return NextResponse.json({ error: 'Error al crear' }, { status: 500 });
  }
}
