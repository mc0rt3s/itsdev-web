import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { facturaSchema } from '@/lib/schemas';
import { buildFacturaWhere, calcularTotalesFactura } from '@/lib/facturas-utils';

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

        const where: Prisma.FacturaWhereInput = buildFacturaWhere(clienteId, estado);

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

        const { itemsWithTotal, subtotal, impuesto, total } = calcularTotalesFactura(items, aplicarIVA);

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
