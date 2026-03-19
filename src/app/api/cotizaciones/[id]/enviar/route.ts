import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';
import { generateCotizacionPDF } from '@/lib/pdf-generator';
import { createCotizacionDecisionToken } from '@/lib/cotizacion-links';
import { writeAuditLog } from '@/lib/audit';

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function nl2br(value: string) {
    return escapeHtml(value).replace(/\n/g, '<br />');
}

function buildDefaultSubject(params: {
    numero: string;
    oportunidad?: string | null;
    etiquetaComercial?: string | null;
}) {
    const parts = [params.etiquetaComercial?.trim(), params.oportunidad?.trim(), `Cotización ${params.numero}`]
        .filter(Boolean);
    return `${parts.join(' | ')} - ITSDev`;
}

function buildDefaultMessage(params: {
    recipientName: string;
    numero: string;
    oportunidad?: string | null;
    etiquetaComercial?: string | null;
    total: number;
    validez: Date;
}) {
    const lines = [
        `Estimado/a ${params.recipientName || 'cliente'},`,
        '',
        params.etiquetaComercial
            ? `Te comparto la cotización ${params.numero} correspondiente a la alternativa "${params.etiquetaComercial}".`
            : `Te comparto la cotización ${params.numero}.`,
        params.oportunidad ? `Esta propuesta forma parte de la oportunidad "${params.oportunidad}".` : '',
        `Monto total: $${params.total.toLocaleString('es-CL')}.`,
        `Vigencia: hasta el ${params.validez.toLocaleDateString('es-CL')}.`,
        '',
        'Quedo atento a tus comentarios para revisar esta opción o compararla con otras alternativas.',
        '',
        'Saludos cordiales,',
        'Equipo ITSDev',
    ].filter(Boolean);

    return lines.join('\n');
}

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
        let body: { destinatario?: string; asunto?: string; mensaje?: string } = {};
        try {
            body = await request.json();
        } catch {
            body = {};
        }

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

        // Determine recipient email (manual override > cliente/prospecto)
        const recipientEmail = body.destinatario?.trim() || cotizacion.cliente?.email || cotizacion.emailProspecto;
        const recipientName = cotizacion.cliente?.razonSocial || cotizacion.nombreProspecto;
        const customSubject = body.asunto?.trim();
        const customMessage = body.mensaje?.trim();

        if (!recipientEmail) {
            return NextResponse.json({ error: 'No hay email de destino registrado' }, { status: 400 });
        }

        // Generate PDF
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

        const baseUrl =
            process.env.PUBLIC_APP_URL ||
            process.env.NEXTAUTH_URL ||
            request.headers.get('origin') ||
            request.nextUrl.origin;

        const expiresAt = new Date(cotizacion.validez).getTime();
        const approveToken = createCotizacionDecisionToken({
            cotizacionId: cotizacion.id,
            action: 'aprobar',
            exp: expiresAt
        });
        const rejectToken = createCotizacionDecisionToken({
            cotizacionId: cotizacion.id,
            action: 'rechazar',
            exp: expiresAt
        });
        const approveUrl = `${baseUrl}/api/cotizaciones/decision?action=aprobar&token=${encodeURIComponent(approveToken)}`;
        const rejectUrl = `${baseUrl}/api/cotizaciones/decision?action=rechazar&token=${encodeURIComponent(rejectToken)}`;
        const attachmentSlug = cotizacion.etiquetaComercial
            ? `-${cotizacion.etiquetaComercial.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
            : '';
        const subject = customSubject || buildDefaultSubject({
            numero: cotizacion.numero,
            oportunidad: cotizacion.oportunidad,
            etiquetaComercial: cotizacion.etiquetaComercial
        });
        const message = customMessage || buildDefaultMessage({
            recipientName: recipientName || 'cliente',
            numero: cotizacion.numero,
            oportunidad: cotizacion.oportunidad,
            etiquetaComercial: cotizacion.etiquetaComercial,
            total: cotizacion.total,
            validez: cotizacion.validez
        });

        // Send email
        const resend = getResendClient();
        const { data, error } = await resend.emails.send({
            from: 'ITSDev <noreply@sender.itsdev.cl>',
            to: [recipientEmail],
            replyTo: 'contacto@itsdev.cl',
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 680px; margin: 0 auto;">
          <h2 style="margin: 0 0 14px;">Cotización ${escapeHtml(cotizacion.numero)}</h2>
          <div style="margin: 0 0 16px; padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            ${cotizacion.oportunidad ? `<p style="margin: 0 0 6px;"><strong>Oportunidad:</strong> ${escapeHtml(cotizacion.oportunidad)}</p>` : ''}
            ${cotizacion.etiquetaComercial ? `<p style="margin: 0 0 6px;"><strong>Alternativa:</strong> ${escapeHtml(cotizacion.etiquetaComercial)}</p>` : ''}
            <p style="margin: 0 0 6px;"><strong>Total:</strong> $${cotizacion.total.toLocaleString('es-CL')}</p>
            <p style="margin: 0;"><strong>Válida hasta:</strong> ${new Date(cotizacion.validez).toLocaleDateString('es-CL')}</p>
          </div>

          <div style="margin: 0 0 18px; line-height: 1.6;">${nl2br(message)}</div>

          <p style="margin: 0 0 8px;">Puedes responder esta cotización directamente desde los siguientes botones:</p>
          <div style="margin: 16px 0 20px;">
            <a href="${approveUrl}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 700; margin-right: 8px;">Aprobar cotización</a>
            <a href="${rejectUrl}" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: 700;">Rechazar cotización</a>
          </div>

          <p style="margin: 0 0 10px;">Si prefieres, también puedes responder este correo con tus comentarios.</p>
        </div>
      `,
            attachments: [
                {
                    filename: `Cotizacion-${cotizacion.numero}${attachmentSlug}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        if (error) {
            console.error('Error enviando email:', error);
            return NextResponse.json({ error: error.message || 'Error al enviar email' }, { status: 500 });
        }

        // Update status to "enviada"
        await prisma.cotizacion.update({
            where: { id },
            data: { estado: 'enviada' }
        });

        await writeAuditLog({
            action: 'cotizacion_enviada',
            entity: 'Cotizacion',
            entityId: cotizacion.id,
            actorId: session.user.id,
            metadata: {
                numero: cotizacion.numero,
                destinatario: recipientEmail,
                asunto: subject,
                oportunidad: cotizacion.oportunidad,
                etiquetaComercial: cotizacion.etiquetaComercial
            }
        });

        return NextResponse.json({
            message: 'Cotización enviada exitosamente',
            emailId: data?.id,
            destinatario: recipientEmail,
            asunto: subject
        });
    } catch (error) {
        console.error('Error enviando cotización:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al enviar cotización' },
            { status: 500 }
        );
    }
}
