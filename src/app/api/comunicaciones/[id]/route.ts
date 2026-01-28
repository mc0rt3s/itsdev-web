import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { comunicacionSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const comunicacion = await prisma.comunicacion.findUnique({
            where: { id },
            include: {
                cliente: { select: { razonSocial: true } },
                usuario: { select: { name: true, email: true } }
            }
        });

        if (!comunicacion) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        return NextResponse.json(comunicacion);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener comunicacion' }, { status: 500 });
    }
}

// PATCH - Actualizar comunicación
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        const data = await request.json();
        const validationResult = comunicacionSchema.safeParse({
            ...data,
            usuarioId: session.user.id, // Mantener el usuario original o actualizar
        });

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { clienteId, tipo, fecha, resumen, detalle, resultado } = validationResult.data;

        const comunicacion = await prisma.comunicacion.update({
            where: { id },
            data: {
                clienteId,
                tipo,
                fecha: new Date(fecha),
                resumen,
                detalle: detalle || null,
                resultado: resultado || null,
            },
            include: {
                cliente: { select: { razonSocial: true } },
                usuario: { select: { name: true, email: true } }
            }
        });

        return NextResponse.json(comunicacion);
    } catch (error: any) {
        console.error('Error al actualizar comunicacion:', error);
        return NextResponse.json({ error: 'Error al actualizar comunicacion' }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    try {
        await prisma.comunicacion.delete({ where: { id } });
        return NextResponse.json({ message: 'Comunicacion eliminada' });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar comunicacion' }, { status: 500 });
    }
}
