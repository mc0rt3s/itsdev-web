import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { enlaceSchema } from '@/lib/schemas';

// GET - Obtener un enlace específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const enlace = await prisma.enlace.findUnique({
      where: { id },
    });

    if (!enlace) {
      return NextResponse.json({ error: 'Enlace no encontrado' }, { status: 404 });
    }

    return NextResponse.json(enlace);
  } catch (error) {
    console.error('Error al obtener enlace:', error);
    return NextResponse.json({ error: 'Error al obtener enlace' }, { status: 500 });
  }
}

// PUT - Actualizar un enlace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const validationResult = enlaceSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { nombre, url, categoria, descripcion, icono, orden, activo } = validationResult.data;

    const enlace = await prisma.enlace.update({
      where: { id },
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

    return NextResponse.json(enlace);
  } catch (error) {
    console.error('Error al actualizar enlace:', error);
    return NextResponse.json({ error: 'Error al actualizar enlace' }, { status: 500 });
  }
}

// DELETE - Eliminar un enlace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.enlace.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar enlace:', error);
    return NextResponse.json({ error: 'Error al eliminar enlace' }, { status: 500 });
  }
}
