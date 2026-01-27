import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Get the cotizacion
        const cotizacion = await prisma.cotizacion.findUnique({
            where: { id },
            include: {
                items: true,
                cliente: true
            }
        });

        if (!cotizacion) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        // Validate state
        if (cotizacion.estado !== 'aprobada') {
            return NextResponse.json({
                error: 'Solo se pueden convertir cotizaciones aprobadas'
            }, { status: 400 });
        }

        // Validate cliente exists
        if (!cotizacion.clienteId) {
            return NextResponse.json({
                error: 'La cotización debe tener un cliente registrado. Convierte el prospecto en cliente primero.'
            }, { status: 400 });
        }

        // Generate invoice number
        const year = new Date().getFullYear();
        const count = await prisma.factura.count();
        const numero = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;

        // Create factura from cotizacion
        const factura = await prisma.factura.create({
            data: {
                clienteId: cotizacion.clienteId,
                numero,
                fechaEmision: new Date(),
                fechaVenc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                estado: 'borrador',
                moneda: cotizacion.moneda,
                subtotal: cotizacion.subtotal,
                impuesto: cotizacion.impuesto,
                total: cotizacion.total,
                notas: `Generada desde cotización ${cotizacion.numero}`,
                cotizacionId: cotizacion.id,
                items: {
                    create: cotizacion.items.map(item => ({
                        descripcion: item.descripcion,
                        cantidad: item.cantidad,
                        precioUnit: item.precioUnit,
                        total: item.total
                    }))
                }
            },
            include: {
                items: true,
                cliente: true
            }
        });

        return NextResponse.json({
            message: 'Factura creada exitosamente',
            facturaId: factura.id,
            numero: factura.numero
        }, { status: 201 });

    } catch (error) {
        console.error('Error convirtiendo cotización:', error);
        return NextResponse.json({ error: 'Error al convertir cotización' }, { status: 500 });
    }
}
