import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Obtener un cliente específico
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
    
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        accesos: true
      }
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
  }
}

// PUT - Actualizar cliente
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
    if (!data.rut || !data.razonSocial) {
      return NextResponse.json(
        { error: 'RUT y Razón Social son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el RUT ya existe en otro cliente
    const existingCliente = await prisma.cliente.findFirst({
      where: {
        rut: data.rut,
        NOT: { id }
      }
    });

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Ya existe otro cliente con este RUT' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        rut: data.rut,
        razonSocial: data.razonSocial,
        contacto: data.contacto || null,
        telefono: data.telefono || null,
        email: data.email || null,
        notas: data.notas || null,
        estado: data.estado,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

// DELETE - Eliminar cliente
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

    await prisma.cliente.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Cliente eliminado' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
}
