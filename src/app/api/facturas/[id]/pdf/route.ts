import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateFacturaPDF } from '@/lib/pdf-generator';

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
        const factura = await prisma.factura.findUnique({
            where: { id },
            include: {
                cliente: {
                    select: { razonSocial: true, rut: true, email: true }
                },
                items: true
            }
        });

        if (!factura) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        const pdfBuffer = generateFacturaPDF({
            numero: factura.numero,
            fechaEmision: factura.fechaEmision.toISOString(),
            fechaVenc: factura.fechaVenc.toISOString(),
            cliente: {
                razonSocial: factura.cliente.razonSocial,
                rut: factura.cliente.rut,
                email: factura.cliente.email || undefined
            },
            items: factura.items.map(item => ({
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precioUnit: item.precioUnit,
                total: item.total
            })),
            subtotal: factura.subtotal,
            impuesto: factura.impuesto,
            total: factura.total,
            notas: factura.notas || undefined
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Factura-${factura.numero}.pdf"`
            }
        });
    } catch (error) {
        console.error('Error generando PDF:', error);
        return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 });
    }
}
