import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// GET: lista reuniones (actividades tipo 'reunion')
export async function GET(request: NextRequest) {
  const ok = await checkAuth(request, ["admin", "user"]);
  if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pendientes = searchParams.get("pendientes"); // 'true' = solo sin oportunidad y no canceladas

  try {
    const reuniones = await prisma.actividad.findMany({
      where: {
        tipo: "reunion",
        ...(pendientes === "true"
          ? { oportunidadId: null, notas: { not: { contains: "estado:cancelada" } } }
          : {}),
      },
      include: {
        cliente: { select: { id: true, razonSocial: true, email: true, rut: true, contacto: true } },
        oportunidad: { select: { id: true, titulo: true, stage: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "desc" },
    });
    return NextResponse.json(reuniones);
  } catch {
    return NextResponse.json({ error: "Error al obtener reuniones" }, { status: 500 });
  }
}

// POST: convertir una reunión en oportunidad (la "reunión llegó a buen puerto")
export async function POST(request: NextRequest) {
  const ok = await checkAuth(request, ["admin", "user"]);
  if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const data = await request.json();
    const { reunionId, clienteId, crearCliente, stageId } = data;

    if (!reunionId) return NextResponse.json({ error: "reunionId es requerido" }, { status: 400 });

    const reunion = await prisma.actividad.findUnique({ where: { id: reunionId } });
    if (!reunion || reunion.tipo !== "reunion") {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 });
    }
    if (reunion.oportunidadId) {
      return NextResponse.json({ error: "Ya convertida a oportunidad", oportunidadId: reunion.oportunidadId });
    }

    // Resolver el cliente
    let targetClienteId = clienteId || null;
    if (!targetClienteId && crearCliente) {
      const { rut, razonSocial, contacto, email, telefono, notas } = crearCliente;
      if (!rut || !razonSocial) {
        return NextResponse.json({ error: "Para crear un cliente se requiere rut y razonSocial" }, { status: 400 });
      }
      const created = await prisma.cliente.create({
        data: {
          rut,
          razonSocial,
          contacto: contacto || null,
          email: email || null,
          telefono: telefono || null,
          notas: notas || `Origen: reunión ${reunion.asunto}`,
          estado: "prospecto",
        },
      });
      targetClienteId = created.id;
    }
    if (!targetClienteId) {
      return NextResponse.json({
        error: "Se requiere clienteId o crearCliente (cliente aún no vinculado a la reunión)",
      }, { status: 400 });
    }

    // Pipeline y etapa por defecto
    let stage = null;
    if (stageId) {
      stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    }
    if (!stage) {
      stage = await prisma.pipelineStage.findFirst({
        where: { isWon: false, isLost: false },
        orderBy: { order: "asc" },
      });
    }
    if (!stage) return NextResponse.json({ error: "No hay etapas de pipeline disponibles" }, { status: 500 });

    const oportunidad = await prisma.oportunidad.create({
      data: {
        clienteId: targetClienteId,
        pipelineId: stage.pipelineId,
        stageId: stage.id,
        titulo: reunion.asunto,
        source: "reunion citas",
      },
    });

    await prisma.actividad.update({
      where: { id: reunion.id },
      data: { clienteId: targetClienteId, oportunidadId: oportunidad.id },
    });

    return NextResponse.json({ ok: true, oportunidadId: oportunidad.id });
  } catch {
    return NextResponse.json({ error: "Error al convertir reunión" }, { status: 500 });
  }
}
