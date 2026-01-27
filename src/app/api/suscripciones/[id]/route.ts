import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { suscripcionSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const suscripcion = await prisma.suscripcion.findUnique({
            where: { id },
            include: {
                cliente: { select: { razonSocial: true } },
                servicio: { select: { nombre: true, tipo: true } }
            }
        });

        if (!suscripcion) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        return NextResponse.json(suscripcion);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener suscripcion' }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const deleted = await prisma.suscripcion.update({
            where: { id },
            data: { estado: 'cancelada' } // Soft delete or cancel
        });
        // Or hard delete if preferred, but subscription history is valuable
        // For now soft cancel
        return NextResponse.json(deleted);
    } catch (error) {
        return NextResponse.json({ error: 'Error al cancelar suscripcion' }, { status: 500 });
    }
}
