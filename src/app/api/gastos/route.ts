import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { gastoSchema } from '@/lib/schemas';

// GET - Listar todos los gastos
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const categoria = searchParams.get('categoria');
        const fechaDesde = searchParams.get('fechaDesde');
        const fechaHasta = searchParams.get('fechaHasta');

        const where: any = {};
        if (categoria) where.categoria = categoria;
        if (fechaDesde || fechaHasta) {
            where.fecha = {};
            if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
            if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
        }

        const gastos = await prisma.gasto.findMany({
            where,
            orderBy: { fecha: 'desc' }
        });

        return NextResponse.json(gastos);
    } catch (error) {
        console.error('Error al obtener gastos:', error);
        return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
    }
}

// POST - Crear un nuevo gasto
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const data = await request.json();
        const validationResult = gastoSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { monto, motivo, categoria, fecha, proveedor, notas } = validationResult.data;
        const comprobante = data.comprobante || null;

        const gasto = await prisma.gasto.create({
            data: {
                monto,
                motivo,
                categoria,
                fecha,
                proveedor: proveedor || null,
                comprobante: comprobante || null,
                notas: notas || null,
            }
        });

        return NextResponse.json(gasto, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear gasto:', error);
        return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 });
    }
}
