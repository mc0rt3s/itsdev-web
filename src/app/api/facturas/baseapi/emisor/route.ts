import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { baseApiGetEmisor } from '@/lib/baseapi';

export async function POST() {
  const session = await auth();
  if (!session) {
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
