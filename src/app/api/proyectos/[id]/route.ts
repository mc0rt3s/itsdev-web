import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { proyectoSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const proyecto = await prisma.proyecto.findUnique({
            where: { id },
            include: {
                cliente: { select: { razonSocial: true } },
                tareas: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        titulo: true,
                        estado: true,
                        prioridad: true,
                        asignadoA: {
                            select: { name: true }
                        }
                    }
                }
            }
        });
        if (!proyecto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        return NextResponse.json(proyecto);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error al obtener proyecto' }, { status: 500 });
    }
}

// PUT
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const data = await request.json();
        const validation = proyectoSchema.safeParse(data);
        if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

        const proyecto = await prisma.proyecto.update({
            where: { id },
            data: validation.data
        });
        return NextResponse.json(proyecto);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        await prisma.proyecto.delete({ where: { id } });
        return NextResponse.json({ message: 'Proyecto eliminado' });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
    }
}
