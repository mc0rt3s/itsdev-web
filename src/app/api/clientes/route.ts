import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { clienteSchema } from '@/lib/schemas';

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

    const validationResult = clienteSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { rut, razonSocial, contacto, telefono, email, notas, estado } = validationResult.data;

    // Verificar si el RUT ya existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { rut }
    });

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este RUT' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        rut,
        razonSocial,
        contacto,
        telefono,
        email,
        notas,
        estado,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
