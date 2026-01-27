import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateCotizacionPDF } from '@/lib/pdf-generator';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const cotizacion = await prisma.cotizacion.findUnique({
            where: { id },
            include: {
                cliente: {
                    select: { razonSocial: true, rut: true, email: true }
                },
                items: true
            }
        });

        if (!cotizacion) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        const pdfBuffer = generateCotizacionPDF({
            numero: cotizacion.numero,
            fecha: cotizacion.fecha.toISOString(),
            validez: cotizacion.validez.toISOString(),
            cliente: cotizacion.cliente ? {
                razonSocial: cotizacion.cliente.razonSocial,
                rut: cotizacion.cliente.rut,
                email: cotizacion.cliente.email || undefined
            } : undefined,
            nombreProspecto: cotizacion.nombreProspecto || undefined,
            emailProspecto: cotizacion.emailProspecto || undefined,
            items: cotizacion.items.map(item => ({
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precioUnit: item.precioUnit,
                total: item.total
            })),
            subtotal: cotizacion.subtotal,
            impuesto: cotizacion.impuesto,
            total: cotizacion.total,
            notas: cotizacion.notas || undefined
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Cotizacion-${cotizacion.numero}.pdf"`
            }
        });
    } catch (error) {
        console.error('Error generando PDF:', error);
        return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 });
    }
}
