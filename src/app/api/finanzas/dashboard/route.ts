import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';
import { rangoMesChile } from '@/lib/iva-utils';

export async function GET(request: NextRequest) {
  const ok = await checkAuth(request);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const ahora = new Date();
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month'); // YYYY-MM format

  let year = ahora.getFullYear();
  let month = ahora.getMonth(); // 0-indexed

  if (monthParam) {
    const [y, m] = monthParam.split('-').map(Number);
    year = y;
    month = m - 1;
  }

  // Rangos en zona Chile (no hora del servidor, que en Dokploy es UTC). hasta es exclusivo.
  const { desde: inicioMes, hasta: finMesEx } = rangoMesChile(year, month + 1);
  const { desde: inicioMesAnt, hasta: inicioMesEx } = rangoMesChile(year, month);

  try {
    const nombresMeses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // Current month
    const [facturasPagadas, gastos, facturasPendientes, facturasPagadasAnt, gastosAnt] = await Promise.all([
      prisma.factura.findMany({
        where: { estado: 'pagada', fechaEmision: { gte: inicioMes, lt: finMesEx } },
        select: { total: true, moneda: true },
      }),
      prisma.gasto.findMany({
        where: { fecha: { gte: inicioMes, lt: finMesEx } },
        select: { monto: true, categoria: true },
      }),
      prisma.factura.findMany({
        where: { estado: { notIn: ['pagada', 'cancelada'] }, fechaVenc: { gte: new Date() } },
        select: { total: true },
      }),
      // Previous month
      prisma.factura.findMany({
        where: { estado: 'pagada', fechaEmision: { gte: inicioMesAnt, lt: inicioMesEx } },
        select: { total: true },
      }),
      prisma.gasto.findMany({
        where: { fecha: { gte: inicioMesAnt, lt: inicioMesEx } },
        select: { monto: true },
      }),
    ]);

    const ingresos = facturasPagadas.reduce((s, f) => s + f.total, 0);
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
    const balance = ingresos - totalGastos;
    const pendiente = facturasPendientes.reduce((s, f) => s + f.total, 0);

    const ingresosAnt = facturasPagadasAnt.reduce((s, f) => s + f.total, 0);
    const gastosAntTotal = gastosAnt.reduce((s, g) => s + g.monto, 0);

    // Gastos por categoría
    const catMap: Record<string, number> = {};
    gastos.forEach(g => {
      const cat = g.categoria.charAt(0).toUpperCase() + g.categoria.slice(1);
      catMap[cat] = (catMap[cat] || 0) + g.monto;
    });

    // Last 6 months trend
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const { desde: d, hasta: dEndEx } = rangoMesChile(year, month - i + 1);
      const [fi, gi] = await Promise.all([
        prisma.factura.findMany({ where: { estado: 'pagada', fechaEmision: { gte: d, lt: dEndEx } }, select: { total: true } }),
        prisma.gasto.findMany({ where: { fecha: { gte: d, lt: dEndEx } }, select: { monto: true } }),
      ]);
      const ing = fi.reduce((s, f) => s + f.total, 0);
      const gas = gi.reduce((s, g) => s + g.monto, 0);
      trend.push({ mes: nombresMeses[d.getMonth()].slice(0,3), ingresos: ing, gastos: gas, balance: ing - gas });
    }

    return NextResponse.json({
      mes: nombresMeses[month],
      año: year,
      ingresos,
      gastos: totalGastos,
      balance,
      pendiente,
      ingresosAnt,
      gastosAnt: gastosAntTotal,
      balanceAnt: ingresosAnt - gastosAntTotal,
      gastosPorCategoria: Object.entries(catMap).map(([name, value]) => ({ name, value })),
      trend,
    });
  } catch (error) {
    console.error('Error finanzas dashboard:', error);
    return NextResponse.json({ error: 'Error al obtener datos financieros' }, { status: 500 });
  }
}
