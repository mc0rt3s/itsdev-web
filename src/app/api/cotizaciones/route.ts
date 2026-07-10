import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { cotizacionSchema } from '@/lib/schemas';
import { requireAuth, parseJsonBody } from '@/lib/api';
import {
    buildCotizacionWhere,
    calcularTotalesCotizacion,
    resolveTipoCambioUSD,
    resolveTipoCambioUF,
} from '@/lib/cotizaciones-utils';

// GET
export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if ('response' in authResult) return authResult.response;

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const estado = searchParams.get('estado');

    const where: Prisma.CotizacionWhereInput = buildCotizacionWhere(clienteId, estado);

    try {
        const cotizaciones = await prisma.cotizacion.findMany({
            where,
            include: {
                cliente: { select: { razonSocial: true, email: true } },
                items: true,
                facturas: {
                    select: { id: true, numero: true, numeroSII: true, estado: true }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        return NextResponse.json(cotizaciones);
    } catch {
        return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 });
    }
}

// POST
export async function POST(request: NextRequest) {
    const authResult = await requireAuth({ roles: ['admin', 'user'] });
    if ('response' in authResult) return authResult.response;

    try {
        const parsed = await parseJsonBody(request, cotizacionSchema);
        if ('response' in parsed) return parsed.response;

        const {
            clienteId, nombreProspecto, emailProspecto, numero, etiquetaOportunidad, etiquetaComercial, fecha, validez, estado, moneda,
            descuento = 0, tipoCambioUSD, tipoCambioUF, modoEnvio, fechaEntrega, formaPago, duracionValidezDias,
            notas, items, aplicarIVA, oportunidadId
        } = parsed.data;

        const [cfgUSD, cfgUF] = await Promise.all([
            prisma.configValor.findUnique({ where: { clave: 'tipoCambioUSD' } }),
            prisma.configValor.findUnique({ where: { clave: 'tipoCambioUF' } }),
        ]);
        const tcUSD = resolveTipoCambioUSD(tipoCambioUSD, cfgUSD?.valor);
        const tcUF = resolveTipoCambioUF(tipoCambioUF, cfgUF?.valor);
        const { itemsWithTotal, subtotal, impuesto, total } = calcularTotalesCotizacion(items, descuento, aplicarIVA);

        const cotizacion = await prisma.cotizacion.create({
            data: {
                ...(clienteId ? { cliente: { connect: { id: clienteId } } } : {}),
                nombreProspecto,
                emailProspecto,
                numero,
                etiquetaOportunidad: etiquetaOportunidad || null,
                etiquetaComercial: etiquetaComercial || null,
                fecha: new Date(fecha),
                validez: new Date(validez),
                estado,
                moneda,
                descuento,
                tipoCambioUSD: tcUSD,
                tipoCambioUF: tcUF,
                modoEnvio: modoEnvio || null,
                fechaEntrega: fechaEntrega || null,
                formaPago: formaPago || null,
                duracionValidezDias: duracionValidezDias || null,
                notas,
                subtotal,
                impuesto,
                total,
                items: { create: itemsWithTotal }
            },
            include: { items: true }
        });

        if (oportunidadId) {
            await prisma.oportunidad.update({
                where: { id: oportunidadId },
                data: { cotizacionId: cotizacion.id }
            });
        }

        return NextResponse.json(cotizacion, { status: 201 });
    } catch (error) {
        console.error('Error al crear cotizacion:', error);
        const msg = error instanceof Error ? error.message : 'Error al crear cotizacion';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
