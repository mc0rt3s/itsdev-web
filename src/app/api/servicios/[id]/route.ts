import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { servicioSchema } from '@/lib/schemas';

// GET - Obtener un servicio
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const servicio = await prisma.servicio.findUnique({
            where: { id },
        });

        if (!servicio) {
            return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
        }

        return NextResponse.json(servicio);
    } catch (error) {
        console.error('Error al obtener servicio:', error);
        return NextResponse.json({ error: 'Error al obtener servicio' }, { status: 500 });
    }
}

// PUT - Actualizar servicio
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const data = await request.json();
        const validationResult = servicioSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { nombre, descripcion, precio, tipo, categoria, activo } = validationResult.data;

        const servicio = await prisma.servicio.update({
            where: { id },
            data: {
                nombre,
                descripcion,
                precio,
                tipo,
                categoria,
                activo,
            },
        });

        return NextResponse.json(servicio);
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 });
    }
}

// DELETE - Eliminar servicio
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.servicio.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Servicio eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 });
    }
}
