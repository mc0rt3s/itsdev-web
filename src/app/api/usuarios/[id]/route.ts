import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
  }

  try {
    const { id } = await params;
    
    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    // Validar campos requeridos
    if (!data.email || !data.name) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe otro usuario con este email' },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: {
      email: string;
      name: string;
      role: string;
      password?: string;
    } = {
      email: data.email,
      name: data.name,
      role: data.role || 'user',
    };

    // Si se proporciona nueva contraseña, hashearla
    if (data.password && data.password.length > 0) {
      if (data.password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // No permitir eliminar el propio usuario
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      );
    }

    // Verificar que no sea el último admin
    const adminsCount = await prisma.user.count({
      where: { role: 'admin' }
    });

    const userToDelete = await prisma.user.findUnique({
      where: { id }
    });

    if (userToDelete?.role === 'admin' && adminsCount <= 1) {
      return NextResponse.json(
        { error: 'No puedes eliminar el último administrador' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
