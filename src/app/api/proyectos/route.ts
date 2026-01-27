import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { proyectoSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const estado = searchParams.get('estado');

    const where: any = {};
    if (clienteId) where.clienteId = clienteId;
    if (estado) where.estado = estado;

    try {
        const proyectos = await prisma.proyecto.findMany({
            where,
            include: {
                cliente: { select: { razonSocial: true } },
                _count: { select: { tareas: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(proyectos);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
    }
}

// POST
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const data = await request.json();
        const validation = proyectoSchema.safeParse(data);
        if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

        const proyecto = await prisma.proyecto.create({
            data: validation.data
        });
        return NextResponse.json(proyecto, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
    }
}
