import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Obtener una nota específica
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
    
    const nota = await prisma.nota.findUnique({
      where: { id },
    });

    if (!nota) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }

    return NextResponse.json(nota);
  } catch (error) {
    console.error('Error al obtener nota:', error);
    return NextResponse.json({ error: 'Error al obtener nota' }, { status: 500 });
  }
}

// PUT - Actualizar nota
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

    if (!data.titulo || !data.contenido) {
      return NextResponse.json(
        { error: 'Título y contenido son requeridos' },
        { status: 400 }
      );
    }

    const nota = await prisma.nota.update({
      where: { id },
      data: {
        titulo: data.titulo,
        contenido: data.contenido,
        favorita: data.favorita ?? false,
        color: data.color || 'slate',
      },
    });

    return NextResponse.json(nota);
  } catch (error) {
    console.error('Error al actualizar nota:', error);
    return NextResponse.json({ error: 'Error al actualizar nota' }, { status: 500 });
  }
}

// PATCH - Toggle favorita
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    const nota = await prisma.nota.findUnique({ where: { id } });
    
    if (!nota) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }

    const updated = await prisma.nota.update({
      where: { id },
      data: { favorita: !nota.favorita },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al actualizar nota:', error);
    return NextResponse.json({ error: 'Error al actualizar nota' }, { status: 500 });
  }
}

// DELETE - Eliminar nota
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

    await prisma.nota.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Nota eliminada' });
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    return NextResponse.json({ error: 'Error al eliminar nota' }, { status: 500 });
  }
}
