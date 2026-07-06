import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const ok = await checkAuth(request);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const en7Dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
  const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
  const hace5Dias = new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000);
  const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);

  try {
    const [
      facturasVencidas,
      facturasPorVencer,
      cotizacionesSinRespuesta,
      suscripcionesPorVencer,
      actividadesHoy,
      oportunidadesSinAccion,
    ] = await Promise.all([
      // Cobrar: facturas vencidas
      prisma.factura.findMany({
        where: {
          estado: { notIn: ['pagada', 'cancelada'] },
          fechaVenc: { lt: hoy },
        },
        include: { cliente: { select: { id: true, razonSocial: true } } },
        orderBy: { fechaVenc: 'asc' },
      }),

      // Cobrar: facturas por vencer en 7 días
      prisma.factura.findMany({
        where: {
          estado: { notIn: ['pagada', 'cancelada'] },
          fechaVenc: { gte: hoy, lte: en7Dias },
        },
        include: { cliente: { select: { id: true, razonSocial: true } } },
        orderBy: { fechaVenc: 'asc' },
      }),

      // Seguimiento: cotizaciones enviadas sin respuesta > 5 días
      prisma.cotizacion.findMany({
        where: {
          estado: 'enviada',
          fecha: { lt: hace5Dias },
        },
        include: { cliente: { select: { id: true, razonSocial: true } } },
        orderBy: { fecha: 'asc' },
      }),

      // Renovaciones: suscripciones por vencer en 30 días
      prisma.suscripcion.findMany({
        where: {
          estado: 'activa',
          proxCobro: { gte: hoy, lte: en30Dias },
        },
        include: {
          cliente: { select: { id: true, razonSocial: true } },
          servicio: { select: { nombre: true } },
        },
        orderBy: { proxCobro: 'asc' },
      }),

      // Hoy: actividades programadas para hoy
      prisma.actividad.findMany({
        where: {
          scheduledAt: { gte: hoy, lt: manana },
          completedAt: null,
        },
        include: {
          cliente: { select: { id: true, razonSocial: true } },
          oportunidad: { select: { id: true, titulo: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      }),

      // Seguimiento: oportunidades abiertas sin próxima acción
      (async () => {
        const openStages = await prisma.pipelineStage.findMany({
          where: { isWon: false, isLost: false },
          select: { id: true },
        });
        const openOps = await prisma.oportunidad.findMany({
          where: { stageId: { in: openStages.map(s => s.id) } },
          include: {
            cliente: { select: { id: true, razonSocial: true } },
            stage: { select: { name: true, color: true } },
            actividades: {
              where: { nextActionDate: { gte: ahora }, completedAt: null },
              take: 1,
            },
          },
        });
        // Only return those with NO future next action
        return openOps.filter(op => op.actividades.length === 0);
      })(),
    ]);

    return NextResponse.json({
      cobrar: [...facturasVencidas.map(f => ({
        tipo: 'factura',
        id: f.id,
        titulo: `Factura ${f.numero}`,
        subtitulo: f.cliente.razonSocial,
        clienteId: f.cliente.id,
        fecha: f.fechaVenc,
        monto: f.total,
        urgente: true,
        href: `/admin/finanzas/facturas`,
      })),
      ...facturasPorVencer.map(f => ({
        tipo: 'factura',
        id: f.id,
        titulo: `Factura ${f.numero}`,
        subtitulo: f.cliente.razonSocial,
        clienteId: f.cliente.id,
        fecha: f.fechaVenc,
        monto: f.total,
        urgente: false,
        href: `/admin/finanzas/facturas`,
      }))],

      seguimiento: [...cotizacionesSinRespuesta.map(c => ({
        tipo: 'cotizacion',
        id: c.id,
        titulo: `Cotización ${c.numero}`,
        subtitulo: c.cliente?.razonSocial || c.nombreProspecto || 'Sin cliente',
        clienteId: c.clienteId,
        fecha: c.fecha,
        monto: c.total,
        urgente: false,
        href: `/admin/cotizaciones`,
      })),
      ...oportunidadesSinAccion.map(op => ({
        tipo: 'oportunidad',
        id: op.id,
        titulo: op.titulo,
        subtitulo: op.cliente.razonSocial,
        clienteId: op.cliente.id,
        fecha: op.updatedAt,
        monto: op.monto,
        urgente: false,
        etapa: op.stage.name,
        etapaColor: op.stage.color,
        href: `/admin/oportunidades`,
      }))],

      renovaciones: suscripcionesPorVencer.map(s => ({
        tipo: 'suscripcion',
        id: s.id,
        titulo: s.servicio.nombre,
        subtitulo: s.cliente.razonSocial,
        clienteId: s.cliente.id,
        fecha: s.proxCobro,
        monto: s.precio,
        urgente: s.proxCobro ? s.proxCobro < en7Dias : false,
        href: `/admin/suscripciones`,
      })),

      hoy: actividadesHoy.map(a => ({
        tipo: 'actividad',
        id: a.id,
        titulo: a.asunto,
        subtitulo: a.cliente?.razonSocial || a.oportunidad?.titulo || '',
        clienteId: a.clienteId,
        oportunidadId: a.oportunidadId,
        fecha: a.scheduledAt,
        tipoActividad: a.tipo,
        urgente: false,
        href: a.oportunidadId ? `/admin/oportunidades` : `/admin/clientes/${a.clienteId}`,
      })),
    });
  } catch (error) {
    console.error('Error en pauta:', error);
    return NextResponse.json({ error: 'Error al obtener pauta' }, { status: 500 });
  }
}
