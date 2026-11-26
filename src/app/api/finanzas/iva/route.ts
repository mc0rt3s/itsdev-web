import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';
import { rangoMesChile, resumenIva } from '@/lib/iva-utils';

// GET /api/finanzas/iva?mes=YYYY-MM
// Declaración F29 del mes: débito = IVA facturado en el mes anterior, crédito = IVA de gastos del mes anterior.
// Ej: mes=2026-11 declara ventas de octubre y gastos de octubre (vence ~12 de noviembre).
export async function GET(request: NextRequest) {
    const ok = await checkAuth(request);
    if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const mes = new URL(request.url).searchParams.get('mes');
    if (!mes || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
        return NextResponse.json({ error: 'mes debe ser YYYY-MM' }, { status: 400 });
    }

    try {
        const [anio, m] = mes.split('-').map(Number);
        // Período declarado = mes anterior al mes de vencimiento
        const periodo = m === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: m - 1 };
        const { desde, hasta } = rangoMesChile(periodo.anio, periodo.mes);

        const [facturas, gastos] = await Promise.all([
            prisma.factura.findMany({
                where: { fechaEmision: { gte: desde, lt: hasta }, estado: { not: 'cancelada' } },
                select: { id: true, numero: true, fechaEmision: true, impuesto: true },
            }),
            prisma.gasto.findMany({
                where: { fecha: { gte: desde, lt: hasta } },
                select: { id: true, motivo: true, fecha: true, iva: true },
            }),
        ]);

        return NextResponse.json({
            periodo: `${periodo.anio}-${String(periodo.mes).padStart(2, '0')}`,
            vencimiento: `${anio}-${String(m).padStart(2, '0')}-12`,
            ...resumenIva(facturas, gastos),
        });
    } catch (error) {
        console.error('Error calculando IVA:', error);
        return NextResponse.json({ error: 'Error al calcular IVA' }, { status: 500 });
    }
}
