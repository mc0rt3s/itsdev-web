import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

const VALID_TRANSITIONS: Record<string, string[]> = {
    borrador: ['enviada', 'anulada'],
    enviada: ['pendiente', 'anulada'],
    pendiente: ['pagada', 'vencida', 'anulada'],
    vencida: ['pagada', 'anulada'],
    pagada: [], // final state
    anulada: [] // final state
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { estado } = await request.json();

    if (!estado) {
        return NextResponse.json({ error: 'Estado requerido' }, { status: 400 });
    }

    try {
        const factura = await prisma.factura.findUnique({
            where: { id }
        });

        if (!factura) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        // Validate transition
        const allowedTransitions = VALID_TRANSITIONS[factura.estado] || [];
        if (!allowedTransitions.includes(estado)) {
            return NextResponse.json({
                error: `No se puede cambiar de "${factura.estado}" a "${estado}". Transiciones permitidas: ${allowedTransitions.join(', ') || 'ninguna'}`
            }, { status: 400 });
        }

        // Update estado
        const updated = await prisma.factura.update({
            where: { id },
            data: { estado }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Error actualizando estado:', error);
        return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 });
    }
}
