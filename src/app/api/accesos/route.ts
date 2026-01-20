import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Listar todos los accesos
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');

    const where = clienteId ? { clienteId } : {};

    const accesos = await prisma.acceso.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
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
    
    return NextResponse.json(accesos);
  } catch (error) {
    console.error('Error al obtener accesos:', error);
    return NextResponse.json({ error: 'Error al obtener accesos' }, { status: 500 });
  }
}

// POST - Crear nuevo acceso
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.nombre || !data.tipo) {
      return NextResponse.json(
        { error: 'Nombre y tipo son requeridos' },
        { status: 400 }
      );
    }

    const acceso = await prisma.acceso.create({
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
    
    return NextResponse.json(acceso, { status: 201 });
  } catch (error) {
    console.error('Error al crear acceso:', error);
    return NextResponse.json({ error: 'Error al crear acceso' }, { status: 500 });
  }
}
