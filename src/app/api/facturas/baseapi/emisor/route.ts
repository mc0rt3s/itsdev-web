import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { baseApiGetEmisor } from '@/lib/baseapi';
import { checkAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const ok = await checkAuth(request);
  if (!ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await baseApiGetEmisor();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo consultar emisor BaseAPI' },
      { status: 500 }
    );
  }
}
