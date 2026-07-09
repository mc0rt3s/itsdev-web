import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { getSiiConfig, emitirDte } from '@/lib/dte';
import type { DteInput } from '@/lib/dte/types';

function formatChileDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;

    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: { select: { razonSocial: true, rut: true } },
        items: true,
      },
    });

    if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    if (factura.numeroSII) return NextResponse.json({ error: 'La factura ya tiene folio SII registrado' }, { status: 409 });
    if (!factura.cliente?.rut) return NextResponse.json({ error: 'El cliente no tiene RUT registrado' }, { status: 400 });
    if (factura.items.length === 0) return NextResponse.json({ error: 'La factura no tiene ítems' }, { status: 400 });

    const config = await getSiiConfig();
    const tipoDte: 33 | 34 = factura.impuesto > 0 ? 33 : 34;
    const fechaEmision = formatChileDate(factura.fechaEmision);
    const fechaVenc = formatChileDate(factura.fechaVenc);

    let formaPago: 1 | 2 | 3;
    if (factura.total <= 0) {
      formaPago = 3;
    } else if (factura.formaPago === 'CREDITO') {
      formaPago = 2;
    } else {
      formaPago = 1;
    }

    const input: DteInput = {
      tipoDte,
      folio: 0, // will be assigned by emitirDte
      fechaEmision,
      fechaVenc,
      formaPago,
      emisor: config,
      receptor: {
        rut: factura.cliente.rut,
        razonSocial: factura.cliente.razonSocial,
      },
      items: factura.items.map(item => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnit: item.precioUnit,
        total: item.total,
      })),
      montoNeto: factura.subtotal,
      iva: factura.impuesto,
      total: factura.total,
      ordenCompra: factura.ordenCompra || undefined,
    };

    const result = await emitirDte(input);

    const facturaActualizada = await prisma.factura.update({
      where: { id },
      data: {
        numeroSII: String(result.folio),
        estado: 'emitida',
        dteProveedor: 'sii-directo',
        dteTipo: tipoDte,
        dteTrackId: result.trackId,
        dteEstado: result.estado,
        dteAmbiente: result.ambiente,
        dteEmitidaAt: new Date(),
        dteUltimaRespuesta: `trackId: ${result.trackId} | estado: ${result.estado}`,
      },
      include: {
        cliente: { select: { razonSocial: true, rut: true } },
        items: true,
        cotizacion: { select: { numero: true } },
      },
    });

    await writeAuditLog({
      action: 'factura_emitida_sii',
      entity: 'Factura',
      entityId: id,
      actorId: auth.session.user.id,
      metadata: {
        ambiente: result.ambiente,
        folio: result.folio,
        trackId: result.trackId,
        estado: result.estado,
        tipoDte,
      },
    });

    return NextResponse.json({ ok: true, factura: facturaActualizada, folio: result.folio, trackId: result.trackId, estado: result.estado, ambiente: result.ambiente });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al emitir en SII';

    try {
      const { id } = await params;
      await prisma.factura.update({
        where: { id },
        data: {
          dteProveedor: 'sii-directo',
          dteEstado: 'error',
          dteUltimaRespuesta: message,
        },
      });
    } catch { /* noop */ }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
