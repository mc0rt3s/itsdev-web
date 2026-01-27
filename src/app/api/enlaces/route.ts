import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { enlaceSchema } from '@/lib/schemas';

// GET - Listar todos los enlaces
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const enlaces = await prisma.enlace.findMany({
      orderBy: [
        { orden: 'asc' },
        { nombre: 'asc' }
      ],
    });

    return NextResponse.json(enlaces);
  } catch (error) {
    console.error('Error al obtener enlaces:', error);
    return NextResponse.json({ error: 'Error al obtener enlaces' }, { status: 500 });
  }
}

// POST - Crear nuevo enlace
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const validationResult = enlaceSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { nombre, url, categoria, descripcion, icono, orden, activo } = validationResult.data;

    const enlace = await prisma.enlace.create({
      data: {
        nombre,
        url,
        categoria,
        descripcion: descripcion || null,
        icono,
        orden,
        activo,
      },
    });

    return NextResponse.json(enlace, { status: 201 });
  } catch (error) {
    console.error('Error al crear enlace:', error);
    return NextResponse.json({ error: 'Error al crear enlace' }, { status: 500 });
  }
}
