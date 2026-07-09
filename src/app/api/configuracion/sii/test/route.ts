import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api';
import { getSiiConfig, authenticateFromBase64 } from '@/lib/dte';

export async function POST(request: NextRequest) {
  const auth = await requireAuth({ roles: ['admin'] });
  if ('response' in auth) return auth.response;

  try {
    const config = await getSiiConfig();
    const token = await authenticateFromBase64(config.certBase64, config.certPassword, config.ambiente);
    return NextResponse.json({ ok: true, ambiente: config.ambiente, tokenLength: token.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al autenticar en SII';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
