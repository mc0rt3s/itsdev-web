import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
    
    if (!data.titulo || !data.contenido) {
      return NextResponse.json(
        { error: 'Título y contenido son requeridos' },
        { status: 400 }
      );
    }

    const nota = await prisma.nota.create({
      data: {
        titulo: data.titulo,
        contenido: data.contenido,
        favorita: data.favorita || false,
        color: data.color || 'slate',
      },
    });
    
    return NextResponse.json(nota, { status: 201 });
  } catch (error) {
    console.error('Error al crear nota:', error);
    return NextResponse.json({ error: 'Error al crear nota' }, { status: 500 });
  }
}
