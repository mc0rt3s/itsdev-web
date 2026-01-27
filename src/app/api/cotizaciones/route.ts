import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { cotizacionSchema } from '@/lib/schemas';

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
        const cotizaciones = await prisma.cotizacion.findMany({
            where,
            include: {
                cliente: { select: { razonSocial: true } },
                items: true
            },
            orderBy: { fecha: 'desc' }
        });
        return NextResponse.json(cotizaciones);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 });
    }
}

// POST
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const data = await request.json();
        const validation = cotizacionSchema.safeParse(data);
        if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

        const { clienteId, nombreProspecto, emailProspecto, numero, fecha, validez, estado, moneda, notas, items, aplicarIVA } = validation.data;

        // Calcular totales
        let subtotal = 0;
        const itemsWithTotal = items.map(item => {
            const itemTotal = item.cantidad * item.precioUnit;
            subtotal += itemTotal;
            return {
                ...item,
                total: itemTotal
            };
        });

        // Calcular IVA 19% si aplica
        const impuesto = aplicarIVA ? Math.round(subtotal * 0.19) : 0;
        const total = subtotal + impuesto;

        const cotizacion = await prisma.cotizacion.create({
            data: {
                clienteId,
                nombreProspecto,
                emailProspecto,
                numero,
                fecha: new Date(fecha),
                validez: new Date(validez),
                estado,
                moneda,
                notas,
                subtotal,
                impuesto,
                total,
                items: {
                    create: itemsWithTotal
                }
            },
            include: { items: true }
        });
        return NextResponse.json(cotizacion, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error al crear cotizacion' }, { status: 500 });
    }
}
