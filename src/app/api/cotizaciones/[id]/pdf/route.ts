import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateCotizacionPDF } from '@/lib/pdf-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
                    select: { razonSocial: true, rut: true, email: true, contacto: true }
                },
                items: true
            }
        });

        if (!cotizacion) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        const pdfBuffer = generateCotizacionPDF({
            numero: cotizacion.numero,
            oportunidad: cotizacion.oportunidad || undefined,
            etiquetaComercial: cotizacion.etiquetaComercial || undefined,
            fecha: cotizacion.fecha.toISOString(),
            validez: cotizacion.validez.toISOString(),
            cliente: cotizacion.cliente ? {
                razonSocial: cotizacion.cliente.razonSocial,
                rut: cotizacion.cliente.rut,
                email: cotizacion.cliente.email || undefined,
                contacto: cotizacion.cliente.contacto || undefined
            } : undefined,
            nombreProspecto: cotizacion.nombreProspecto || undefined,
            emailProspecto: cotizacion.emailProspecto || undefined,
            items: cotizacion.items.map(item => ({
                sku: item.sku || undefined,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precioUnit: item.precioUnit,
                total: item.total
            })),
            subtotal: cotizacion.subtotal,
            descuento: cotizacion.descuento || undefined,
            impuesto: cotizacion.impuesto,
            total: cotizacion.total,
            notas: cotizacion.notas || undefined,
            modoEnvio: cotizacion.modoEnvio || undefined,
            fechaEntrega: cotizacion.fechaEntrega || undefined,
            formaPago: cotizacion.formaPago || undefined,
            duracionValidezDias: cotizacion.duracionValidezDias || undefined
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Cotizacion-${cotizacion.numero}${cotizacion.etiquetaComercial ? `-${cotizacion.etiquetaComercial.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}` : ''}.pdf"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                Pragma: 'no-cache',
                Expires: '0',
                'Surrogate-Control': 'no-store',
            }
        });
    } catch (error) {
        console.error('Error generando PDF:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al generar PDF' },
            { status: 500 }
        );
    }
}
