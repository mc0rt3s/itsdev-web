import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { calcularTotalesFactura } from '@/lib/facturas-utils';

// GET - Obtener una factura específica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        const factura = await prisma.factura.findUnique({
            where: { id },
            include: {
                cliente: { select: { razonSocial: true, rut: true, email: true } },
                items: {
                    include: {
                        servicio: { select: { nombre: true, categoria: true } }
                    }
                },
                pagos: true,
                proyecto: { select: { nombre: true } },
                cotizacion: { select: { numero: true } }
            }
        });

        if (!factura) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        return NextResponse.json(factura);
    } catch (error: unknown) {
        console.error('Error al obtener factura:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al obtener factura';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// PATCH - Actualizar factura (estado, numeroSII, etc)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        const data = await request.json();
        const { estado, numeroSII, notas, fechaEmision, fechaVenc, formaPago, items, aplicarIVA } = data;
        const actual = await prisma.factura.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!actual) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        // Validar estado si se proporciona
        if (estado && !['emitida', 'enviada', 'pendiente', 'pagada', 'cancelada', 'vencida'].includes(estado)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
        }
        if (formaPago && !['CONTADO', 'CREDITO', 'SIN_COSTO'].includes(formaPago)) {
            return NextResponse.json({ error: 'Forma de pago inválida' }, { status: 400 });
        }
        if (items !== undefined && (!Array.isArray(items) || items.length === 0)) {
            return NextResponse.json({ error: 'Debes enviar al menos un ítem' }, { status: 400 });
        }

        const paidOnlyAllowsCancel = actual.estado === 'pagada';
        const hasNonEstadoChanges = numeroSII !== undefined
            || notas !== undefined
            || fechaEmision !== undefined
            || fechaVenc !== undefined
            || formaPago !== undefined
            || items !== undefined
            || aplicarIVA !== undefined;

        if (paidOnlyAllowsCancel) {
            if (hasNonEstadoChanges) {
                return NextResponse.json({ error: 'Las facturas pagadas no se pueden modificar. Solo puedes cambiarlas a cancelada.' }, { status: 400 });
            }
            if (estado !== undefined && estado !== 'cancelada' && estado !== 'pagada') {
                return NextResponse.json({ error: 'Una factura pagada solo puede mantenerse pagada o pasar a cancelada.' }, { status: 400 });
            }
        }

        const updateData: Prisma.FacturaUpdateInput = {};
        if (estado !== undefined) updateData.estado = estado;
        if (fechaEmision !== undefined) updateData.fechaEmision = new Date(`${fechaEmision}T12:00:00`);
        if (fechaVenc !== undefined) updateData.fechaVenc = new Date(`${fechaVenc}T12:00:00`);
        if (formaPago !== undefined) updateData.formaPago = formaPago;
        if (numeroSII !== undefined) {
            updateData.numeroSII = numeroSII === '' ? null : numeroSII;
            if (numeroSII && estado === undefined && actual.estado === 'pendiente') {
                updateData.estado = 'emitida';
            }
        }
        if (notas !== undefined) updateData.notas = notas;
        if (items !== undefined) {
            const sanitizedItems = items.map((item: { descripcion: string; cantidad: number; precioUnit: number; servicioId?: string | null }) => ({
                descripcion: String(item.descripcion ?? '').trim(),
                cantidad: Number(item.cantidad),
                precioUnit: Number(item.precioUnit),
                servicioId: item.servicioId ?? null,
            }));

            const invalidItem = sanitizedItems.find(
                (item) => !item.descripcion || !Number.isFinite(item.cantidad) || item.cantidad <= 0 || !Number.isFinite(item.precioUnit) || item.precioUnit < 0
            );

            if (invalidItem) {
                return NextResponse.json({ error: 'Los ítems de la factura son inválidos' }, { status: 400 });
            }

            const useIva = typeof aplicarIVA === 'boolean' ? aplicarIVA : actual.impuesto > 0;
            const { itemsWithTotal, subtotal, impuesto, total } = calcularTotalesFactura(sanitizedItems, useIva);

            updateData.subtotal = subtotal;
            updateData.impuesto = impuesto;
            updateData.total = total;
            updateData.items = {
                deleteMany: {},
                create: itemsWithTotal,
            };
        }

        const factura = await prisma.factura.update({
            where: { id },
            data: updateData,
            include: {
                cliente: { select: { razonSocial: true, rut: true, email: true } },
                items: {
                    include: {
                        servicio: { select: { nombre: true, categoria: true } }
                    }
                },
                pagos: true,
                proyecto: { select: { nombre: true } },
                cotizacion: { select: { numero: true } }
            }
        });

        return NextResponse.json(factura);
    } catch (error: unknown) {
        console.error('Error al actualizar factura:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar factura';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// DELETE - Eliminar factura
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const { id } = await params;
        await prisma.factura.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Factura eliminada' });
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 });
    }
}
