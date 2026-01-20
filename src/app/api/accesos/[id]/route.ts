import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Obtener un acceso específico
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
    
    const acceso = await prisma.acceso.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            razonSocial: true,
            rut: true,
          }
        }
      }
    });

    if (!acceso) {
      return NextResponse.json({ error: 'Acceso no encontrado' }, { status: 404 });
    }

    return NextResponse.json(acceso);
  } catch (error) {
    console.error('Error al obtener acceso:', error);
    return NextResponse.json({ error: 'Error al obtener acceso' }, { status: 500 });
  }
}

// PUT - Actualizar acceso
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

    // Validar campos requeridos
    if (!data.nombre || !data.tipo) {
      return NextResponse.json(
        { error: 'Nombre y tipo son requeridos' },
        { status: 400 }
      );
    }

    const acceso = await prisma.acceso.update({
      where: { id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        url: data.url || null,
        puerto: data.puerto || null,
        usuario: data.usuario || null,
        password: data.password || null,
        notas: data.notas || null,
        clienteId: data.clienteId || null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            razonSocial: true,
          }
        }
      }
    });

    return NextResponse.json(acceso);
  } catch (error) {
    console.error('Error al actualizar acceso:', error);
    return NextResponse.json({ error: 'Error al actualizar acceso' }, { status: 500 });
  }
}

// DELETE - Eliminar acceso
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

    await prisma.acceso.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Acceso eliminado' });
  } catch (error) {
    console.error('Error al eliminar acceso:', error);
    return NextResponse.json({ error: 'Error al eliminar acceso' }, { status: 500 });
  }
}
