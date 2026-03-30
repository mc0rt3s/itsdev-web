import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { baseApiEmitFactura, getBaseApiConfig, summarizeBaseApiResponse, truncateItemName } from '@/lib/baseapi';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: { select: { razonSocial: true, rut: true, email: true } },
        items: true,
      },
    });

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (factura.numeroSII) {
      return NextResponse.json({ error: 'La factura ya tiene folio SII registrado' }, { status: 409 });
    }

    if (!factura.cliente?.rut) {
      return NextResponse.json({ error: 'El cliente no tiene RUT registrado' }, { status: 400 });
    }

    if (factura.items.length === 0) {
      return NextResponse.json({ error: 'La factura no tiene ítems' }, { status: 400 });
    }

    if (factura.items.length > 10) {
      return NextResponse.json({ error: 'BaseAPI permite máximo 10 ítems por factura' }, { status: 400 });
    }

    const afectaIva = factura.impuesto > 0;
    const fechaEmision = factura.fechaEmision.toISOString().slice(0, 10);
    const fechaVenc = factura.fechaVenc.toISOString().slice(0, 10);
    const formaPago = factura.total <= 0 ? 'SIN_COSTO' : fechaVenc > fechaEmision ? 'CREDITO' : 'CONTADO';

    const payload = {
      receptor: {
        rut: factura.cliente.rut,
        contacto: factura.cliente.email || undefined,
      },
      items: factura.items.map((item) => ({
        nombre: truncateItemName(item.descripcion),
        cantidad: item.cantidad,
        precio: item.precioUnit,
        unidad: 'UN',
        descripcion_extendida: item.descripcion.length > 25 ? item.descripcion : undefined,
      })),
      forma_pago: formaPago,
      fecha_emision: fechaEmision,
      pagos: formaPago === 'CREDITO'
        ? [{ fecha: fechaVenc, monto: Math.round(factura.total), glosa: `Pago factura ${factura.numero}`.slice(0, 40) }]
        : undefined,
      descargar_pdf: false,
    } as const;

    const emitResult = await baseApiEmitFactura(payload, afectaIva);
    const config = getBaseApiConfig();
    const folio = emitResult.folio ? String(emitResult.folio) : null;
    const trackId = emitResult.trackId ? String(emitResult.trackId) : null;
    const dteEstado = emitResult.success
      ? (folio ? 'emitida' : 'respuesta_sin_folio')
      : 'error';

    const facturaActualizada = await prisma.factura.update({
      where: { id },
      data: {
        numeroSII: folio,
        estado: folio ? 'emitida' : factura.estado,
        dteProveedor: 'baseapi',
        dteTipo: afectaIva ? 33 : 34,
        dteTrackId: trackId,
        dteEstado,
        dteAmbiente: config.ambiente,
        dteUltimaRespuesta: summarizeBaseApiResponse(emitResult.raw),
        dteEmitidaAt: new Date(),
      },
      include: {
        cliente: { select: { razonSocial: true, rut: true, email: true } },
        items: true,
        cotizacion: { select: { numero: true } },
      },
    });

    await writeAuditLog({
      action: 'factura_emitida_baseapi',
      entity: 'Factura',
      entityId: factura.id,
      actorId: session.user.id,
      metadata: {
        proveedor: 'baseapi',
        ambiente: config.ambiente,
        facturaNumero: factura.numero,
        numeroSII: folio,
        trackId,
        dteEstado,
        dteTipo: afectaIva ? 33 : 34,
      },
    });

    return NextResponse.json({
      ok: true,
      factura: facturaActualizada,
      folio,
      trackId,
      ambiente: config.ambiente,
      raw: emitResult.raw,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo emitir la factura en BaseAPI';
    try {
      const { id } = await params;
      const config = getBaseApiConfig();
      await prisma.factura.update({
        where: { id },
        data: {
          dteProveedor: 'baseapi',
          dteAmbiente: config.ambiente,
          dteEstado: 'error',
          dteUltimaRespuesta: summarizeBaseApiResponse({ error: message }),
        },
      });
    } catch {
      // noop: no queremos ocultar el error principal por un fallo de persistencia
    }

    return NextResponse.json(
      {
        error: message.includes('Execution context was destroyed')
          ? 'BaseAPI perdió el contexto del navegador mientras navegaba el portal del SII. Se reintentó una vez automáticamente. Intenta nuevamente en unos segundos.'
          : message
      },
      { status: 500 }
    );
  }
}
