import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notaSchema } from '@/lib/schemas';

// GET - Listar todas las notas
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const notas = await prisma.nota.findMany({
      orderBy: [
        { favorita: 'desc' },
        { updatedAt: 'desc' }
      ],
    });

    return NextResponse.json(notas);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    return NextResponse.json({ error: 'Error al obtener notas' }, { status: 500 });
  }
}

// POST - Crear nueva nota
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const validationResult = notaSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { titulo, contenido, favorita, color } = validationResult.data;

    const nota = await prisma.nota.create({
      data: {
        titulo,
        contenido,
        favorita,
        color,
      },
    });

    return NextResponse.json(nota, { status: 201 });
  } catch (error) {
    console.error('Error al crear nota:', error);
    return NextResponse.json({ error: 'Error al crear nota' }, { status: 500 });
  }
}
