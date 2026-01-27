import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tareaSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const tarea = await prisma.tarea.findUnique({
            where: { id },
            include: {
                proyecto: { select: { nombre: true } },
                asignadoA: { select: { name: true } }
            }
        });
        if (!tarea) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        return NextResponse.json(tarea);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener tarea' }, { status: 500 });
    }
}

// PUT
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const data = await request.json();
        // Partial update allowed?
        const validation = tareaSchema.partial().safeParse(data);
        if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

        const tarea = await prisma.tarea.update({
            where: { id },
            data: validation.data
        });
        return NextResponse.json(tarea);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        await prisma.tarea.delete({ where: { id } });
        return NextResponse.json({ message: 'Tarea eliminada' });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar tarea' }, { status: 500 });
    }
}
