import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Listar todos los clientes
export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { accesos: true }
        }
      }
    });
    
    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.rut || !data.razonSocial) {
      return NextResponse.json(
        { error: 'RUT y Razón Social son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el RUT ya existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { rut: data.rut }
    });

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este RUT' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        rut: data.rut,
        razonSocial: data.razonSocial,
        contacto: data.contacto || null,
        telefono: data.telefono || null,
        email: data.email || null,
        notas: data.notas || null,
        estado: data.estado || 'activo',
      },
    });
    
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
