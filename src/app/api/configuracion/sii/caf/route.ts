import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api';
import { parseCafXml } from '@/lib/dte';
import { z } from 'zod';

const cafSchema = z.object({
  xml:     z.string().min(1),
  ambiente: z.enum(['certification', 'production']),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth({ roles: ['admin'] });
  if ('response' in auth) return auth.response;

  const cafs = await prisma.siiCaf.findMany({ orderBy: { tipoDte: 'asc' }, omit: { xml: true } as never });
  return NextResponse.json({ cafs });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth({ roles: ['admin'] });
  if ('response' in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const parsed = cafSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { xml, ambiente } = parsed.data;

  let cafData: ReturnType<typeof parseCafXml>;
  try {
    cafData = parseCafXml(xml);
  } catch (e) {
    return NextResponse.json({ error: `CAF inválido: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  const { tipoDte, folioDesde, folioHasta } = cafData;

  const existing = await prisma.siiCaf.findUnique({ where: { tipoDte_ambiente: { tipoDte, ambiente } } });

  const caf = existing
    ? await prisma.siiCaf.update({
        where: { id: existing.id },
        data: { xml, folioDesde, folioHasta, folioActual: folioDesde - 1 },
      })
    : await prisma.siiCaf.create({
        data: { tipoDte, xml, folioDesde, folioHasta, folioActual: folioDesde - 1, ambiente },
      });

  return NextResponse.json({ ok: true, id: caf.id, tipoDte, folioDesde, folioHasta, ambiente });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth({ roles: ['admin'] });
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  await prisma.siiCaf.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
