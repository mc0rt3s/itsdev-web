import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const periodo = searchParams.get('periodo') || 'mes'; // mes, trimestre, año

        // Calcular fechas según período
        const ahora = new Date();
        let fechaInicio: Date;
        
        switch (periodo) {
            case 'mes':
                fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
                break;
            case 'trimestre':
                const trimestre = Math.floor(ahora.getMonth() / 3);
                fechaInicio = new Date(ahora.getFullYear(), trimestre * 3, 1);
                break;
            case 'año':
                fechaInicio = new Date(ahora.getFullYear(), 0, 1);
                break;
            default:
                fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        }

        // Obtener todas las facturas del período
        const facturas = await prisma.factura.findMany({
            where: {
                fechaEmision: { gte: fechaInicio }
            },
            include: {
                cliente: { select: { razonSocial: true, id: true } },
                items: {
                    include: {
                        servicio: { select: { nombre: true, categoria: true } }
                    }
                }
            }
        });

        // Flujo de caja por estado
        const flujoCaja = {
            totalEmitido: facturas.reduce((sum, f) => sum + f.total, 0),
            totalPagado: facturas.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
            totalPendiente: facturas.filter(f => ['emitida', 'enviada', 'pendiente'].includes(f.estado)).reduce((sum, f) => sum + f.total, 0),
            totalVencido: facturas.filter(f => f.estado === 'vencida').reduce((sum, f) => sum + f.total, 0),
            totalCancelado: facturas.filter(f => f.estado === 'cancelada').reduce((sum, f) => sum + f.total, 0),
        };

        // Facturas por estado
        const porEstado = {
            emitida: facturas.filter(f => f.estado === 'emitida').length,
            enviada: facturas.filter(f => f.estado === 'enviada').length,
            pendiente: facturas.filter(f => f.estado === 'pendiente').length,
            pagada: facturas.filter(f => f.estado === 'pagada').length,
            cancelada: facturas.filter(f => f.estado === 'cancelada').length,
            vencida: facturas.filter(f => f.estado === 'vencida').length,
        };

        // Top clientes por facturación
        const clientesMap = new Map<string, { nombre: string; total: number; cantidad: number }>();
        facturas.forEach(f => {
            const clienteId = f.cliente.id;
            const clienteNombre = f.cliente.razonSocial;
            const existente = clientesMap.get(clienteId) || { nombre: clienteNombre, total: 0, cantidad: 0 };
            clientesMap.set(clienteId, {
                nombre: clienteNombre,
                total: existente.total + f.total,
                cantidad: existente.cantidad + 1
            });
        });
        const topClientes = Array.from(clientesMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // Servicios más rentables (por items de facturas)
        const serviciosMap = new Map<string, { nombre: string; categoria: string; total: number; cantidad: number }>();
        facturas.forEach(f => {
            f.items.forEach(item => {
                const servicioNombre = item.servicio?.nombre || item.descripcion;
                const servicioCategoria = item.servicio?.categoria || 'general';
                const key = servicioNombre;
                const existente = serviciosMap.get(key) || { nombre: servicioNombre, categoria: servicioCategoria, total: 0, cantidad: 0 };
                serviciosMap.set(key, {
                    nombre: servicioNombre,
                    categoria: servicioCategoria,
                    total: existente.total + item.total,
                    cantidad: existente.cantidad + item.cantidad
                });
            });
        });
        const topServicios = Array.from(serviciosMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // Flujo mensual (últimos 6 meses)
        const flujoMensual = [];
        for (let i = 5; i >= 0; i--) {
            const mes = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const mesFin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0);
            const facturasMes = facturas.filter(f => {
                const fecha = new Date(f.fechaEmision);
                return fecha >= mes && fecha <= mesFin;
            });
            flujoMensual.push({
                mes: mes.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
                emitido: facturasMes.reduce((sum, f) => sum + f.total, 0),
                pagado: facturasMes.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
            });
        }

        return NextResponse.json({
            flujoCaja,
            porEstado,
            topClientes,
            topServicios,
            flujoMensual,
            periodo
        });
    } catch (error) {
        console.error('Error al obtener dashboard:', error);
        return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
    }
}
