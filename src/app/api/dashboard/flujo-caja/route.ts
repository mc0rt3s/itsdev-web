import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const periodo = searchParams.get('periodo') || 'mes'; // mes, trimestre, año

        // Calcular fechas según el período
        const ahora = new Date();
        let fechaInicio: Date;

        switch (periodo) {
            case 'trimestre':
                const mesActual = ahora.getMonth();
                const trimestre = Math.floor(mesActual / 3);
                fechaInicio = new Date(ahora.getFullYear(), trimestre * 3, 1);
                break;
            case 'año':
                fechaInicio = new Date(ahora.getFullYear(), 0, 1);
                break;
            case 'mes':
            default:
                fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
                break;
        }

        // Obtener ingresos (facturas pagadas)
        const facturasPagadas = await prisma.factura.findMany({
            where: {
                estado: 'pagada',
                fechaEmision: {
                    gte: fechaInicio,
                },
            },
            select: {
                total: true,
                fechaEmision: true,
            },
        });

        // Obtener pagos registrados (por si hay pagos parciales)
        const pagos = await prisma.pago.findMany({
            where: {
                fecha: {
                    gte: fechaInicio,
                },
            },
            include: {
                factura: {
                    select: {
                        estado: true,
                    },
                },
            },
        });

        // Calcular ingresos totales
        const ingresosFacturas = facturasPagadas.reduce((sum, f) => sum + f.total, 0);
        const ingresosPagos = pagos.reduce((sum, p) => sum + p.monto, 0);
        const totalIngresos = ingresosFacturas + ingresosPagos;

        // Obtener gastos
        const gastos = await prisma.gasto.findMany({
            where: {
                fecha: {
                    gte: fechaInicio,
                },
            },
            select: {
                monto: true,
                fecha: true,
            },
        });

        const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

        // Calcular balance
        const balance = totalIngresos - totalGastos;

        // Obtener facturas pendientes (por cobrar)
        const facturasPendientes = await prisma.factura.findMany({
            where: {
                estado: {
                    in: ['emitida', 'enviada', 'pendiente'],
                },
                fechaEmision: {
                    gte: fechaInicio,
                },
            },
            select: {
                total: true,
            },
        });

        const totalPendiente = facturasPendientes.reduce((sum, f) => sum + f.total, 0);

        // Obtener facturas vencidas
        const facturasVencidas = await prisma.factura.findMany({
            where: {
                estado: {
                    in: ['emitida', 'enviada', 'pendiente'],
                },
                fechaVenc: {
                    lt: ahora,
                },
            },
            select: {
                total: true,
            },
        });

        const totalVencido = facturasVencidas.reduce((sum, f) => sum + f.total, 0);

        // Estadísticas adicionales
        const totalFacturasEmitidas = await prisma.factura.count({
            where: {
                fechaEmision: {
                    gte: fechaInicio,
                },
            },
        });

        const totalGastosRegistrados = gastos.length;

        return NextResponse.json({
            periodo,
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: ahora.toISOString(),
            ingresos: {
                total: totalIngresos,
                facturasPagadas: ingresosFacturas,
                pagos: ingresosPagos,
            },
            gastos: {
                total: totalGastos,
                cantidad: totalGastosRegistrados,
            },
            balance,
            pendiente: {
                total: totalPendiente,
                cantidad: facturasPendientes.length,
            },
            vencido: {
                total: totalVencido,
                cantidad: facturasVencidas.length,
            },
            estadisticas: {
                facturasEmitidas: totalFacturasEmitidas,
                gastosRegistrados: totalGastosRegistrados,
            },
        });
    } catch (error: any) {
        console.error('Error al obtener flujo de caja:', error);
        return NextResponse.json({ error: 'Error al obtener flujo de caja' }, { status: 500 });
    }
}
