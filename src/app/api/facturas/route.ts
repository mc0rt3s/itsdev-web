import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { facturaSchema } from '@/lib/schemas';

// GET - Listar todas las facturas
export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const clienteId = searchParams.get('clienteId');
        const estado = searchParams.get('estado');

        const where: any = {};
        if (clienteId) where.clienteId = clienteId;
        if (estado) where.estado = estado;

        const facturas = await prisma.factura.findMany({
            where,
            include: {
                cliente: {
                    select: { razonSocial: true, rut: true }
                },
                items: true,
            },
            orderBy: { fechaEmision: 'desc' },
        });

        return NextResponse.json(facturas);
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
    }
}

// POST - Crear nueva factura
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const validationResult = facturaSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { clienteId, numero, numeroSII, fechaEmision, fechaVenc, estado, moneda, notas, proyectoId, items, aplicarIVA } = validationResult.data;

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

        const factura = await prisma.factura.create({
            data: {
                clienteId,
                numero,
                numeroSII,
                fechaEmision: new Date(fechaEmision),
                fechaVenc: new Date(fechaVenc),
                estado,
                moneda,
                notas,
                proyectoId,
                subtotal,
                impuesto,
                total,
                items: {
                    create: itemsWithTotal
                }
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(factura, { status: 201 });
    } catch (error) {
        console.error('Error al crear factura:', error);
        return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
    }
}
