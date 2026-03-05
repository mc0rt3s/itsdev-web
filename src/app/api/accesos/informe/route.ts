import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { requireAuth, parseJsonBody, getErrorMessage } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { accesoInformeSchema } from '@/lib/schemas';
import { writeAuditLog } from '@/lib/audit';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no configurada');
  }
  return new Resend(apiKey);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function POST(req: Request) {
  const authResult = await requireAuth({ roles: ['admin'] });
  if ('response' in authResult) return authResult.response;

  const limit = checkRateLimit({
    key: `accesos-informe:${authResult.session.user.id}`,
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.ok) {
    await writeAuditLog({
      action: 'accesos_informe_rate_limited',
      entity: 'cliente',
      actorId: authResult.session.user.id,
      metadata: {
        retryAfterSeconds: limit.retryAfterSeconds,
      },
    });

    return NextResponse.json(
      { error: `Demasiadas solicitudes. Intenta nuevamente en ${limit.retryAfterSeconds}s` },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSeconds),
          'X-RateLimit-Remaining': String(limit.remaining),
        },
      }
    );
  }

  try {
    const parsed = await parseJsonBody(req, accesoInformeSchema);
    if ('response' in parsed) return parsed.response;

    const { clienteId, destinatario, asunto, mensaje } = parsed.data;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'API key de Resend no configurada' },
        { status: 500 }
      );
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        accesos: {
          orderBy: { tipo: 'asc' },
        },
      },
    });

    if (!cliente) {
      await writeAuditLog({
        action: 'accesos_informe_cliente_no_encontrado',
        entity: 'cliente',
        entityId: clienteId,
        actorId: authResult.session.user.id,
      });
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (cliente.accesos.length === 0) {
      await writeAuditLog({
        action: 'accesos_informe_sin_accesos',
        entity: 'cliente',
        entityId: clienteId,
        actorId: authResult.session.user.id,
      });
      return NextResponse.json(
        { error: 'El cliente no tiene accesos registrados' },
        { status: 400 }
      );
    }

    const tiposLabels: Record<string, string> = {
      hosting: 'Hosting',
      cpanel: 'cPanel',
      email: 'Email',
      ftp: 'FTP',
      ssh: 'SSH',
      db: 'Base de Datos',
      vpn: 'VPN',
      cloud: 'Cloud',
      otro: 'Otro',
    };

    const accesosHTML = cliente.accesos
      .map((acceso) => {
        const tipo = escapeHtml(tiposLabels[acceso.tipo] || acceso.tipo);
        const nombre = escapeHtml(acceso.nombre);
        const url = acceso.url ? escapeHtml(acceso.url) : null;
        const puerto = acceso.puerto ? escapeHtml(acceso.puerto) : null;
        const usuario = acceso.usuario ? escapeHtml(acceso.usuario) : null;
        const password = acceso.password ? escapeHtml(acceso.password) : null;
        const notas = acceso.notas ? escapeHtml(acceso.notas) : null;

        return `
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #7AA228;">
        <h3 style="margin: 0 0 8px 0; color: #224859; font-size: 16px;">
          ${tipo} - ${nombre}
        </h3>
        ${url ? `<p style="margin: 4px 0; color: #475569;"><strong>URL:</strong> ${url}${puerto ? `:${puerto}` : ''}</p>` : ''}
        ${usuario ? `<p style="margin: 4px 0; color: #475569;"><strong>Usuario:</strong> ${usuario}</p>` : ''}
        ${password ? `<p style="margin: 4px 0; color: #475569;"><strong>Contraseña:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${password}</code></p>` : ''}
        ${notas ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px; font-style: italic;">${notas}</p>` : ''}
      </div>
    `;
      })
      .join('');

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f0f0; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: #224859; padding: 28px 30px; text-align: center;">
            <p style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -1px;">ITS<span style="color: #7AA228;">-Dev</span></p>
            <p style="color: rgba(255,255,255,0.7); font-size: 11px; letter-spacing: 2px; margin: 4px 0 0;">SOLUCIONES TECNOLÓGICAS</p>
          </div>

          <div style="background: #7AA228; padding: 16px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 600;">Informe de Accesos</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 14px;">${escapeHtml(cliente.razonSocial)}</p>
          </div>

          <div style="padding: 24px 30px;">
            ${mensaje ? `<p style="color: #475569; margin-bottom: 24px; white-space: pre-wrap; background: #f8fafc; padding: 16px; border-radius: 8px;">${escapeHtml(mensaje)}</p>` : ''}

            <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
              A continuación se detallan los accesos asociados a su cuenta:
            </p>

            ${accesosHTML}

            <div style="margin-top: 24px; padding: 16px; background: #fef3cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 13px; margin: 0;">
                <strong>Importante:</strong> Esta información es confidencial. Por favor, guárdela en un lugar seguro y no la comparta con terceros no autorizados.
              </p>
            </div>
          </div>

          <div style="background: #224859; padding: 18px 30px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0;">
              <strong>ItsDev</strong> - Soluciones Tecnológicas que Funcionan
            </p>
            <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 6px 0 0;">
              contacto@itsdev.cl - +56 9 7536 2904
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: 'ItsDev <noreply@sender.itsdev.cl>',
      to: [destinatario],
      subject: asunto || `Informe de Accesos - ${cliente.razonSocial}`,
      html: emailHTML,
    });

    if (error) {
      await writeAuditLog({
        action: 'accesos_informe_error_envio',
        entity: 'cliente',
        entityId: clienteId,
        actorId: authResult.session.user.id,
        metadata: {
          destinatario,
          error: error.message,
        },
      });
      return NextResponse.json(
        { error: `Error al enviar el correo: ${error.message}` },
        { status: 500 }
      );
    }

    await writeAuditLog({
      action: 'accesos_informe_enviado',
      entity: 'cliente',
      entityId: clienteId,
      actorId: authResult.session.user.id,
      metadata: {
        destinatario,
        emailId: data?.id ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Correo enviado correctamente',
        emailId: data?.id,
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(limit.remaining),
        },
      }
    );
  } catch (error: unknown) {
    console.error('Error en informe de accesos:', error);
    await writeAuditLog({
      action: 'accesos_informe_error',
      entity: 'cliente',
      actorId: authResult.session.user.id,
      metadata: {
        error: getErrorMessage(error, 'Error al procesar la solicitud'),
      },
    });
    return NextResponse.json(
      { error: getErrorMessage(error, 'Error al procesar la solicitud') },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const authResult = await requireAuth({ roles: ['admin'] });
  if ('response' in authResult) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('clienteId');

    if (!clienteId) {
      return NextResponse.json(
        { error: 'Cliente requerido' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        accesos: {
          orderBy: { tipo: 'asc' },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error: unknown) {
    console.error('Error al obtener informe de accesos:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Error al obtener datos') },
      { status: 500 }
    );
  }
}
