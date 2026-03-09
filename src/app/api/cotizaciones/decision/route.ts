import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyCotizacionDecisionToken } from '@/lib/cotizacion-links';
import { writeAuditLog } from '@/lib/audit';
import { notifyCotizacionEstadoChange } from '@/lib/cotizacion-notify';

function responsePage(title: string, message: string, ok: boolean) {
    const badgeColor = ok ? '#65a30d' : '#b91c1c';
    const borderColor = ok ? '#d9f99d' : '#fecaca';

    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #1e293b; }
      .wrap { max-width: 640px; margin: 56px auto; padding: 0 16px; }
      .card { background: #fff; border: 1px solid ${borderColor}; border-radius: 12px; padding: 24px; box-shadow: 0 8px 30px rgba(15,23,42,.06); }
      .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: ${badgeColor}; color: #fff; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
      h1 { margin: 0 0 10px; font-size: 24px; }
      p { margin: 0; line-height: 1.55; color: #334155; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="card">
        <span class="badge">${ok ? 'Proceso completado' : 'No se pudo completar'}</span>
        <h1>${title}</h1>
        <p>${message}</p>
      </section>
    </main>
  </body>
</html>`;

    return new NextResponse(html, {
        status: ok ? 200 : 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token');
    const action = request.nextUrl.searchParams.get('action');

    if (!token || (action !== 'aprobar' && action !== 'rechazar')) {
        return responsePage('Link invalido', 'El enlace no es valido o esta incompleto.', false);
    }

    const payload = verifyCotizacionDecisionToken(token);
    if (!payload || payload.action !== action) {
        return responsePage('Link expirado', 'Este enlace ya no es valido. Solicita el reenvio de la cotizacion.', false);
    }

    const cotizacion = await prisma.cotizacion.findUnique({
        where: { id: payload.cotizacionId },
        select: { id: true, numero: true, estado: true, validez: true }
    });

    if (!cotizacion) {
        return responsePage('Cotizacion no encontrada', 'No pudimos encontrar la cotizacion asociada a este enlace.', false);
    }

    if (cotizacion.estado === 'aprobada') {
        return responsePage('Cotizacion ya aprobada', `La cotizacion ${cotizacion.numero} ya estaba aprobada.`, true);
    }

    if (cotizacion.estado === 'rechazada') {
        return responsePage('Cotizacion ya rechazada', `La cotizacion ${cotizacion.numero} ya estaba rechazada.`, true);
    }

    if (new Date() > cotizacion.validez) {
        await prisma.cotizacion.update({
            where: { id: cotizacion.id },
            data: { estado: 'vencida' }
        });
        await writeAuditLog({
            action: 'cotizacion_estado_actualizado',
            entity: 'Cotizacion',
            entityId: cotizacion.id,
            actorId: null,
            metadata: {
                estadoAnterior: cotizacion.estado,
                estadoNuevo: 'vencida',
                canal: 'cliente_link'
            }
        });
        await notifyCotizacionEstadoChange({
            cotizacionId: cotizacion.id,
            numero: cotizacion.numero,
            estadoAnterior: cotizacion.estado,
            estadoNuevo: 'vencida',
            canal: 'cliente_link'
        });
        return responsePage('Cotizacion vencida', `La cotizacion ${cotizacion.numero} ya no se puede responder porque vencio.`, false);
    }

    const newState = action === 'aprobar' ? 'aprobada' : 'rechazada';
    await prisma.cotizacion.update({
        where: { id: cotizacion.id },
        data: { estado: newState }
    });
    await writeAuditLog({
        action: 'cotizacion_estado_actualizado',
        entity: 'Cotizacion',
        entityId: cotizacion.id,
        actorId: null,
        metadata: {
            estadoAnterior: cotizacion.estado,
            estadoNuevo: newState,
            canal: 'cliente_link'
        }
    });
    await notifyCotizacionEstadoChange({
        cotizacionId: cotizacion.id,
        numero: cotizacion.numero,
        estadoAnterior: cotizacion.estado,
        estadoNuevo: newState,
        canal: 'cliente_link'
    });

    return responsePage(
        action === 'aprobar' ? 'Cotizacion aprobada' : 'Cotizacion rechazada',
        action === 'aprobar'
            ? `Confirmamos la aprobacion de la cotizacion ${cotizacion.numero}. Te contactaremos para los siguientes pasos.`
            : `Confirmamos el rechazo de la cotizacion ${cotizacion.numero}. Gracias por la respuesta.`,
        true
    );
}
