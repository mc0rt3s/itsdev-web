import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

interface AuditMetadata {
    estadoAnterior?: string;
    estadoNuevo?: string;
    canal?: string;
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const limitParam = Number(request.nextUrl.searchParams.get('limit') || 50);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    try {
        const logs = await prisma.auditLog.findMany({
            where: {
                action: 'cotizacion_estado_actualizado',
                entity: 'Cotizacion'
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const entityIds = Array.from(new Set(logs.map((log) => log.entityId).filter(Boolean))) as string[];
        const cotizaciones = entityIds.length > 0
            ? await prisma.cotizacion.findMany({
                where: { id: { in: entityIds } },
                select: { id: true, numero: true }
            })
            : [];

        const cotizacionMap = new Map(cotizaciones.map((cotizacion) => [cotizacion.id, cotizacion.numero]));

        const items = logs.map((log) => {
            let metadata: AuditMetadata = {};
            if (log.metadata) {
                try {
                    metadata = JSON.parse(log.metadata) as AuditMetadata;
                } catch {
                    metadata = {};
                }
            }

            const numero = log.entityId ? cotizacionMap.get(log.entityId) : undefined;
            return {
                id: log.id,
                createdAt: log.createdAt,
                cotizacionId: log.entityId,
                cotizacionNumero: numero || null,
                estadoAnterior: metadata.estadoAnterior || null,
                estadoNuevo: metadata.estadoNuevo || null,
                canal: metadata.canal || 'desconocido',
                actorId: log.actorId || null
            };
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Error obteniendo notificaciones de cotizaciones:', error);
        return NextResponse.json(
            { error: 'No se pudieron obtener las notificaciones' },
            { status: 500 }
        );
    }
}
