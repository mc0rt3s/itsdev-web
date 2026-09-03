import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId');
  const estado = searchParams.get('estado');

  if (!clienteId) {
    return NextResponse.json({ error: 'clienteId requerido' }, { status: 400 });
  }

  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const where: { clienteId: string; estado?: string } = { clienteId };
    if (estado) where.estado = estado;

    const entries = await prisma.facturableEntry.findMany({
      where,
      orderBy: { fechaRegistro: 'desc' },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error al listar FacturableEntry:', error);
    return NextResponse.json({ error: 'Error al listar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ok = await checkAuth(request, ['admin']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (entries.length === 0) {
      return NextResponse.json({ error: 'entries requerido (array no vacío)' }, { status: 400 });
    }

    const results = [];

    for (const entry of entries) {
      // Validar datos
      if (!entry.clockifyTaskId || !entry.clienteId) {
        return NextResponse.json(
          { error: 'clockifyTaskId y clienteId requeridos' },
          { status: 400 }
        );
      }

      if (
        typeof entry.horas !== 'number' ||
        typeof entry.precioUnitario !== 'number' ||
        typeof entry.montoTotal !== 'number' ||
        entry.horas <= 0 ||
        entry.precioUnitario <= 0 ||
        entry.montoTotal <= 0
      ) {
        return NextResponse.json(
          { error: 'horas, precioUnitario, montoTotal deben ser números > 0' },
          { status: 400 }
        );
      }

      // Verificar cliente existe
      const cliente = await prisma.cliente.findUnique({
        where: { id: entry.clienteId },
      });
      if (!cliente) {
        return NextResponse.json(
          { error: `Cliente ${entry.clienteId} no encontrado` },
          { status: 404 }
        );
      }

      // Buscar existente por clockifyTaskId
      const existing = await prisma.facturableEntry.findUnique({
        where: { clockifyTaskId: entry.clockifyTaskId },
      });

      if (existing) {
        // Actualizar
        const updated = await prisma.facturableEntry.update({
          where: { clockifyTaskId: entry.clockifyTaskId },
          data: {
            estado: entry.estado ?? existing.estado,
            clockifyTagId: entry.clockifyTagId ?? existing.clockifyTagId,
            clockifyTags: entry.clockifyTags ?? existing.clockifyTags,
          },
        });
        results.push({ ...updated, action: 'updated' });
      } else {
        // Crear
        const created = await prisma.facturableEntry.create({
          data: {
            clockifyTaskId: entry.clockifyTaskId,
            clienteId: entry.clienteId,
            descripcion: entry.descripcion || '',
            horas: entry.horas,
            tipoCobro: entry.tipoCobro || 'habil',
            precioUnitario: entry.precioUnitario,
            montoTotal: entry.montoTotal,
            clockifyTagId: entry.clockifyTagId ?? null,
            clockifyTags: entry.clockifyTags ?? null,
            estado: entry.estado || 'pendiente',
            fechaRegistro: entry.fechaRegistro ? new Date(entry.fechaRegistro) : new Date(),
          },
        });
        results.push({ ...created, action: 'created' });
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('Error al crear/actualizar FacturableEntry:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
