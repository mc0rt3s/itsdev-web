import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';
import { generateCotizacionPDF } from '@/lib/pdf-generator';

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

        // Determine recipient email
        const recipientEmail = cotizacion.cliente?.email || cotizacion.emailProspecto;
        const recipientName = cotizacion.cliente?.razonSocial || cotizacion.nombreProspecto;

        if (!recipientEmail) {
            return NextResponse.json({ error: 'No hay email de destino registrado' }, { status: 400 });
        }

        // Generate PDF
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

        // Send email
        const resend = getResendClient();
        const { data, error } = await resend.emails.send({
            from: 'ITSDev <cotizaciones@itsdev.cl>',
            to: [recipientEmail],
            subject: `Cotización ${cotizacion.numero} - ITSDev`,
            html: `
        <h2>Estimado/a ${recipientName},</h2>
        <p>Adjuntamos la cotización <strong>${cotizacion.numero}</strong> por un monto total de <strong>$${cotizacion.total.toLocaleString('es-CL')}</strong>.</p>
        <p><strong>Válida hasta:</strong> ${new Date(cotizacion.validez).toLocaleDateString('es-CL')}</p>
        <p>Por favor, revise el documento adjunto para más detalles sobre nuestra propuesta.</p>
        <p>Quedamos atentos a sus comentarios y disponibles para cualquier consulta.</p>
        <br/>
        <p>Saludos cordiales,<br/>Equipo ITSDev</p>
      `,
            attachments: [
                {
                    filename: `Cotizacion-${cotizacion.numero}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        if (error) {
            console.error('Error enviando email:', error);
            return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 });
        }

        // Update status to "enviada"
        await prisma.cotizacion.update({
            where: { id },
            data: { estado: 'enviada' }
        });

        return NextResponse.json({
            message: 'Cotización enviada exitosamente',
            emailId: data?.id
        });
    } catch (error) {
        console.error('Error enviando cotización:', error);
        return NextResponse.json({ error: 'Error al enviar cotización' }, { status: 500 });
    }
}
