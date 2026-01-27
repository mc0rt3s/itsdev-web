import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Obtener una factura específica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        const factura = await prisma.factura.findUnique({
            where: { id },
            include: {
                cliente: { select: { razonSocial: true, rut: true, email: true } },
                items: {
                    include: {
                        servicio: { select: { nombre: true, categoria: true } }
                    }
                },
                pagos: true,
                proyecto: { select: { nombre: true } },
                cotizacion: { select: { numero: true } }
            }
        });

        if (!factura) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        return NextResponse.json(factura);
    } catch (error: any) {
        console.error('Error al obtener factura:', error);
        const errorMessage = error?.message || 'Error al obtener factura';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// PATCH - Actualizar factura (estado, numeroSII, etc)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        const data = await request.json();
        const { estado, numeroSII, notas } = data;

        // Validar estado si se proporciona
        if (estado && !['emitida', 'enviada', 'pendiente', 'pagada', 'cancelada', 'vencida'].includes(estado)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
        }

        const updateData: any = {};
        if (estado !== undefined) updateData.estado = estado;
        if (numeroSII !== undefined) updateData.numeroSII = numeroSII === '' ? null : numeroSII;
        if (notas !== undefined) updateData.notas = notas;

        const factura = await prisma.factura.update({
            where: { id },
            data: updateData,
            include: {
                cliente: { select: { razonSocial: true, rut: true, email: true } },
                items: {
                    include: {
                        servicio: { select: { nombre: true, categoria: true } }
                    }
                },
                pagos: true,
                proyecto: { select: { nombre: true } },
                cotizacion: { select: { numero: true } }
            }
        });

        return NextResponse.json(factura);
    } catch (error: any) {
        console.error('Error al actualizar factura:', error);
        const errorMessage = error?.message || 'Error al actualizar factura';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// DELETE - Eliminar factura
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        await prisma.factura.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Factura eliminada' });
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 });
    }
}
