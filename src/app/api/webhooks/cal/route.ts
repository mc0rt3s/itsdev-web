import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";

// Secret compartido con Cal.com (se necesita CAL_WEBHOOK_SECRET en el .env).
const SECRET = process.env.CAL_WEBHOOK_SECRET;

function normEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

function constantEq(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

const REUNION_UID = (uid: string) => `uid:${uid}`;

async function findReunionByUid(uid: string) {
  if (!uid) return null;
  return prisma.actividad.findFirst({
    where: { tipo: "reunion", notas: { contains: REUNION_UID(uid) } },
    orderBy: { createdAt: "desc" },
  });
}

export async function POST(request: NextRequest) {
  if (!SECRET) {
    return NextResponse.json({ error: "CAL_WEBHOOK_SECRET no configurado" }, { status: 500 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-cal-signature-256");
  // Recalcular con el body crudo (exactamente como Cal lo firmó).
  const expected = createHmac("sha256", SECRET).update(raw).digest("hex");
  if (!signature || !constantEq(expected, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const trigger = body.triggerEvent;
  const payload = body.payload || {};
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const attendee = attendees[0] || {};
  const responses = payload.responses || {};

  const email = normEmail(attendee.email || responses.email?.value);
  const name = attendee.name || responses.name?.value || (email ? email.split("@")[0] : "Desconocido");
  const phone = responses.phone?.value || attendee.phone || null;
  const extraNotes = responses.notes?.value || payload.additionalNotes || "";
  const title = payload.eventTitle || payload.title || "Reunión";
  const uid = payload.uid || "";
  const start = payload.startTime ? new Date(payload.startTime) : null;
  const end = payload.endTime ? new Date(payload.endTime) : null;
  const organizerName = payload.user?.name || "";
  const location = payload.location || "";

  try {
    // Cliente existente por email (opcional): la reunión puede quedar sin vínculo hasta convertirla.
    let cliente = null;
    if (email) {
      cliente = await prisma.cliente.findFirst({ where: { email } });
    }

    const notasBase = [
      REUNION_UID(uid),
      email ? `email:${email}` : "",
      phone ? `telefono:${phone}` : "",
      organizerName ? `organizador:${organizerName}` : "",
      location ? `lugar:${location}` : "",
      extraNotes ? `notas:${extraNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (trigger === "BOOKING_CREATED") {
      const existing = await findReunionByUid(uid);
      if (existing) {
        return NextResponse.json({ ok: true, reunionId: existing.id, duplicate: true });
      }
      const act = await prisma.actividad.create({
        data: {
          clienteId: cliente ? cliente.id : null,
          tipo: "reunion",
          asunto: `${title} - ${name}`,
          notas: notasBase,
          scheduledAt: start,
        },
      });
      return NextResponse.json({ ok: true, reunionId: act.id, trigger });
    }

    if (trigger === "BOOKING_RESCHEDULED") {
      const existing = await findReunionByUid(uid);
      if (existing) {
        const updated = await prisma.actividad.update({
          where: { id: existing.id },
          data: {
            scheduledAt: start,
            notas: notasBase,
            asunto: `${existing.asunto.replace(/ \(Reprogramada\)$/, "")} (Reprogramada)`,
          },
        });
        return NextResponse.json({ ok: true, reunionId: updated.id, trigger });
      }
      // No existía (p.ej. creado antes de activar el webhook): lo creamos.
      const act = await prisma.actividad.create({
        data: {
          clienteId: cliente ? cliente.id : null,
          tipo: "reunion",
          asunto: `${title} - ${name} (Reprogramada)`,
          notas: notasBase,
          scheduledAt: start,
        },
      });
      return NextResponse.json({ ok: true, reunionId: act.id, trigger });
    }

    if (trigger === "BOOKING_CANCELLED") {
      const existing = await findReunionByUid(uid);
      if (existing) {
        const updated = await prisma.actividad.update({
          where: { id: existing.id },
          data: {
            asunto: `${existing.asunto.replace(/ \(Cancelada\)$/, "")} (Cancelada)`,
            notas: existing.notas ? `${existing.notas}\nestado:cancelada` : "estado:cancelada",
            completedAt: new Date(),
          },
        });
        return NextResponse.json({ ok: true, reunionId: updated.id, trigger });
      }
      return NextResponse.json({ ok: true, ignored: true, trigger });
    }

    return NextResponse.json({ ok: false, ignored: true, trigger });
  } catch (err: any) {
    console.error("Error en webhook de Cal:", err);
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}

// Health check para confirmar que el endpoint está vivo (GET no implica procesar eventos).
export async function GET() {
  return NextResponse.json({ ok: true });
}
