import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { suscripcionSchema } from '@/lib/schemas';

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
        const suscripciones = await prisma.suscripcion.findMany({
            where,
            include: {
                cliente: { select: { razonSocial: true } },
                servicio: { select: { nombre: true, tipo: true } }
            },
            orderBy: { fechaInicio: 'desc' }
        });
        return NextResponse.json(suscripciones);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
    }
}

// POST
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const data = await request.json();
        const validation = suscripcionSchema.safeParse(data);
        if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

        const { fechaInicio, ciclo } = validation.data;

        // Calcular proxCobro
        let proxCobro = new Date(fechaInicio);
        if (ciclo === 'mensual') proxCobro.setMonth(proxCobro.getMonth() + 1);
        else if (ciclo === 'anual') proxCobro.setFullYear(proxCobro.getFullYear() + 1);
        else if (ciclo === 'trimestral') proxCobro.setMonth(proxCobro.getMonth() + 3);

        const suscripcion = await prisma.suscripcion.create({
            data: {
                ...validation.data,
                proxCobro
            }
        });
        return NextResponse.json(suscripcion, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al crear suscripcion' }, { status: 500 });
    }
}
