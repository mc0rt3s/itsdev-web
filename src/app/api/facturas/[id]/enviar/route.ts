import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';
import { generateFacturaPDF } from '@/lib/pdf-generator';

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('RESEND_API_KEY no configurada');
    }
    return new Resend(apiKey);
}

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

        if (!factura.cliente.email) {
            return NextResponse.json({ error: 'El cliente no tiene email registrado' }, { status: 400 });
        }

        // Generate PDF
        const pdfBuffer = generateFacturaPDF({
            numero: factura.numero,
            fechaEmision: factura.fechaEmision.toISOString(),
            fechaVenc: factura.fechaVenc.toISOString(),
            cliente: {
                razonSocial: factura.cliente.razonSocial,
                rut: factura.cliente.rut,
                email: factura.cliente.email
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

        // Send email with PDF attachment
        const resend = getResendClient();
        const { data, error } = await resend.emails.send({
            from: 'ITSDev <facturacion@itsdev.cl>',
            to: [factura.cliente.email],
            subject: `Factura ${factura.numero} - ITSDev`,
            html: `
        <h2>Estimado/a ${factura.cliente.razonSocial},</h2>
        <p>Adjuntamos la factura <strong>${factura.numero}</strong> por un monto total de <strong>$${factura.total.toLocaleString('es-CL')}</strong>.</p>
        <p><strong>Fecha de vencimiento:</strong> ${new Date(factura.fechaVenc).toLocaleDateString('es-CL')}</p>
        <p>Por favor, revise el documento adjunto para más detalles.</p>
        <br/>
        <p>Saludos cordiales,<br/>Equipo ITSDev</p>
      `,
            attachments: [
                {
                    filename: `Factura-${factura.numero}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        if (error) {
            console.error('Error enviando email:', error);
            return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 });
        }

        // Update status to "enviada"
        await prisma.factura.update({
            where: { id },
            data: { estado: 'enviada' }
        });

        return NextResponse.json({
            message: 'Factura enviada exitosamente',
            emailId: data?.id
        });
    } catch (error) {
        console.error('Error enviando factura:', error);
        return NextResponse.json({ error: 'Error al enviar factura' }, { status: 500 });
    }
}
