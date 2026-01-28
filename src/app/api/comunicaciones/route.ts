import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { comunicacionSchema } from '@/lib/schemas';

// GET
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');

    const where: any = {};
    if (clienteId) where.clienteId = clienteId;

    try {
        const comunicaciones = await prisma.comunicacion.findMany({
            where,
            include: {
                cliente: { select: { id: true, razonSocial: true } },
                usuario: { select: { name: true, email: true } }
            },
            orderBy: { fecha: 'desc' }
        });
        return NextResponse.json(comunicaciones);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener comunicaciones' }, { status: 500 });
    }
}

// POST
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const data = await request.json();
        // Inject usuarioId before validation if schema requires it, or handle it
        // Schema says usuarioId is required string.
        // Client likely doesn't send it, backend sets it.
        // We should allow schema without usuarioId for input, but here we add it

        // Check if schema handles this. If schema requires usuarioId in input, we must provide it.
        // In schemas.ts: usuarioId: z.string().min(1, 'El usuario es requerido')

        const dataWithUser = { ...data, usuarioId: user.id };

        const validation = comunicacionSchema.safeParse(dataWithUser);
        if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

        const comunicacion = await prisma.comunicacion.create({
            data: validation.data
        });
        return NextResponse.json(comunicacion, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error al crear comunicacion' }, { status: 500 });
    }
}
