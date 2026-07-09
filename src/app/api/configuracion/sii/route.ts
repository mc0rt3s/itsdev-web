import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api';
import { z } from 'zod';

const siiConfigSchema = z.object({
  certBase64:      z.string().min(1),
  certPassword:    z.string().min(1),
  rutFirmante:     z.string().min(1),
  rutEmpresa:      z.string().min(1),
  razonSocial:     z.string().min(1),
  giro:            z.string().min(1),
  acteco:          z.number().int().positive(),
  direccion:       z.string().min(1),
  comuna:          z.string().min(1),
  ciudad:          z.string().min(1),
  fechaResolucion: z.string().min(1),
  numResolucion:   z.number().int().min(0),
  ambiente:        z.enum(['certification', 'production']),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth({ roles: ['admin'] });
  if ('response' in auth) return auth.response;

  const cfg = await prisma.siiConfig.findFirst({ omit: { certBase64: true, certPassword: true } as never });
  if (!cfg) return NextResponse.json({ config: null });

  return NextResponse.json({
    config: {
      ...cfg,
      certBase64: '[configurado]',
      certPassword: '[configurado]',
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth({ roles: ['admin'] });
  if ('response' in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const parsed = siiConfigSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const data = parsed.data;
  const existing = await prisma.siiConfig.findFirst();

  const config = existing
    ? await prisma.siiConfig.update({ where: { id: existing.id }, data })
    : await prisma.siiConfig.create({ data });

  return NextResponse.json({ ok: true, id: config.id });
}
