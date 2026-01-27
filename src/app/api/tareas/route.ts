import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tareaSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get('proyectoId');
    const asignadoAId = searchParams.get('asignadoAId');
    const estado = searchParams.get('estado');

    const where: any = {};
    if (proyectoId) where.proyectoId = proyectoId;
    if (asignadoAId) where.asignadoAId = asignadoAId;
    if (estado) where.estado = estado;

    try {
        const tareas = await prisma.tarea.findMany({
            where,
            include: {
                proyecto: { select: { nombre: true, cliente: { select: { razonSocial: true } } } },
                asignadoA: { select: { name: true } }
            },
            orderBy: { fechaVenc: 'asc' }
        });
        return NextResponse.json(tareas);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 });
    }
}

// POST
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const data = await request.json();
        const validation = tareaSchema.safeParse(data);
        if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

        const tarea = await prisma.tarea.create({
            data: validation.data
        });
        return NextResponse.json(tarea, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 });
    }
}
