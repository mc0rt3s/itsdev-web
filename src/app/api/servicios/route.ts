import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { servicioSchema } from '@/lib/schemas';

// GET - Listar todos los servicios
export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const servicios = await prisma.servicio.findMany({
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(servicios);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
    }
}

// POST - Crear nuevo servicio
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const validationResult = servicioSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const servicio = await prisma.servicio.create({
            data: validationResult.data,
        });

        return NextResponse.json(servicio, { status: 201 });
    } catch (error) {
        console.error('Error al crear servicio:', error);
        return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 });
    }
}
