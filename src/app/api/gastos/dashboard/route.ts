import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

    // Total gastos mes actual
    const gastosMesActual = await prisma.gasto.findMany({
      where: { fecha: { gte: inicioMesActual } },
      select: { monto: true },
    });
    const totalMesActual = gastosMesActual.reduce((sum, g) => sum + g.monto, 0);

    // Total gastos mes anterior
    const gastosMesAnterior = await prisma.gasto.findMany({
      where: {
        fecha: {
          gte: inicioMesAnterior,
          lte: finMesAnterior,
        },
      },
      select: { monto: true },
    });
    const totalMesAnterior = gastosMesAnterior.reduce((sum, g) => sum + g.monto, 0);

    // Variación porcentual
    const variacionPorcentual =
      totalMesAnterior > 0
        ? ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100
        : 0;

    // Gastos por categoría (mes actual)
    const gastosPorCategoria = await prisma.gasto.groupBy({
      by: ['categoria'],
      where: { fecha: { gte: inicioMesActual } },
      _sum: { monto: true },
      _count: { id: true },
    });

    // Gastos por proveedor (mes actual) - top 10
    const gastosPorProveedor = await prisma.gasto.groupBy({
      by: ['proveedor'],
      where: {
        fecha: { gte: inicioMesActual },
        proveedor: { not: null },
      },
      _sum: { monto: true },
      _count: { id: true },
      orderBy: { _sum: { monto: 'desc' } },
      take: 10,
    });

    // Gastos últimos 6 meses para tendencia
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0);
      
      const gastosMes = await prisma.gasto.findMany({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        select: { monto: true },
      });

      meses.push({
        mes: fechaInicio.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
        total: gastosMes.reduce((sum, g) => sum + g.monto, 0),
        cantidad: gastosMes.length,
      });
    }

    // Total general
    const totalGastos = await prisma.gasto.aggregate({
      _sum: { monto: true },
      _count: { id: true },
    });

    // Promedio mensual (últimos 6 meses)
    const promedioMensual = meses.reduce((sum, m) => sum + m.total, 0) / meses.length;

    return NextResponse.json({
      totalMesActual,
      totalMesAnterior,
      variacionPorcentual,
      totalGeneral: totalGastos._sum.monto || 0,
      totalRegistros: totalGastos._count.id || 0,
      promedioMensual,
      porCategoria: gastosPorCategoria.map((g) => ({
        categoria: g.categoria,
        total: g._sum.monto || 0,
        cantidad: g._count.id || 0,
      })),
      porProveedor: gastosPorProveedor.map((g) => ({
        proveedor: g.proveedor || 'Sin proveedor',
        total: g._sum.monto || 0,
        cantidad: g._count.id || 0,
      })),
      tendenciaMensual: meses,
    });
  } catch (error) {
    console.error('Error al obtener métricas de gastos:', error);
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
  }
}
