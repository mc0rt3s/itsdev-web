import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { cotizacionSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const cotizacion = await prisma.cotizacion.findUnique({
            where: { id },
            include: {
                cliente: { select: { razonSocial: true } },
                items: true
            }
        });
        if (!cotizacion) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        return NextResponse.json(cotizacion);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener cotizacion' }, { status: 500 });
    }
}

// PUT - Actualizar estado o datos
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const data = await request.json();
        // Validate partial update or full schema?
        // Using full schema implies recreating items if sent. 
        // For simplicity, allow updating fields directly if verified, or use schema.
        // Let's rely on schema for consistency but handling items is complex.
        // If client sends items, we replace.

        // Check if items are present
        if (data.items) {
            // Full update logic with items replacement
            const validation = cotizacionSchema.safeParse(data);
            if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

            const { items, ...rest } = validation.data;

            // Calculate totals again
            let subtotal = 0;
            const itemsWithTotal = items.map(item => {
                const t = item.cantidad * item.precioUnit;
                subtotal += t;
                return { ...item, total: t };
            });
            const total = subtotal + 0; // Tax 0

            const cotizacion = await prisma.cotizacion.update({
                where: { id },
                data: {
                    ...rest,
                    subtotal,
                    total,
                    items: {
                        deleteMany: {},
                        create: itemsWithTotal
                    }
                }
            });
            return NextResponse.json(cotizacion);
        } else {
            // Partial update (e.g. status)
            // We should validate fields if possible, but strict schema might fail if required fields missing.
            // So let's assume client sends safe data or we use partial schema.
            // For now, allow direct update of status.
            const { estado } = data;
            if (estado) {
                const cotizacion = await prisma.cotizacion.update({
                    where: { id },
                    data: { estado }
                });
                return NextResponse.json(cotizacion);
            }
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar cotizacion' }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        await prisma.cotizacion.delete({ where: { id } });
        return NextResponse.json({ message: 'Cotizacion eliminada' });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar cotizacion' }, { status: 500 });
    }
}
