import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { gastoSchema } from '@/lib/schemas';
import { unlink } from 'fs/promises';
import { join } from 'path';

// GET - Obtener un gasto específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        const gasto = await prisma.gasto.findUnique({
            where: { id }
        });

        if (!gasto) {
            return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
        }

        return NextResponse.json(gasto);
    } catch (error) {
        console.error('Error al obtener gasto:', error);
        return NextResponse.json({ error: 'Error al obtener gasto' }, { status: 500 });
    }
}

// PATCH - Actualizar un gasto
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        const data = await request.json();

        // Validar si se está actualizando el comprobante
        const updateData: any = {};
        if (data.monto !== undefined) updateData.monto = data.monto;
        if (data.motivo !== undefined) updateData.motivo = data.motivo;
        if (data.categoria !== undefined) updateData.categoria = data.categoria;
        if (data.fecha !== undefined) updateData.fecha = new Date(data.fecha);
        if (data.proveedor !== undefined) updateData.proveedor = data.proveedor || null;
        if (data.notas !== undefined) updateData.notas = data.notas || null;
        if (data.comprobante !== undefined) {
            // Si hay un comprobante anterior y se está reemplazando, eliminar el anterior
            if (data.comprobanteAnterior && data.comprobanteAnterior !== data.comprobante) {
                try {
                    const oldPath = join(process.cwd(), 'public', data.comprobanteAnterior);
                    await unlink(oldPath);
                } catch (err) {
                    console.error('Error al eliminar comprobante anterior:', err);
                }
            }
            updateData.comprobante = data.comprobante || null;
        }

        const gasto = await prisma.gasto.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(gasto);
    } catch (error: any) {
        console.error('Error al actualizar gasto:', error);
        return NextResponse.json({ error: 'Error al actualizar gasto' }, { status: 500 });
    }
}

// DELETE - Eliminar un gasto
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        
        // Obtener el gasto para eliminar el comprobante si existe
        const gasto = await prisma.gasto.findUnique({
            where: { id },
            select: { comprobante: true }
        });

        if (gasto?.comprobante) {
            try {
                const filePath = join(process.cwd(), 'public', gasto.comprobante);
                await unlink(filePath);
            } catch (err) {
                console.error('Error al eliminar comprobante:', err);
            }
        }

        await prisma.gasto.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Gasto eliminado' });
    } catch (error) {
        console.error('Error al eliminar gasto:', error);
        return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 });
    }
}
