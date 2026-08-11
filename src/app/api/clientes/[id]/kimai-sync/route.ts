import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { kimaiEnabled, syncClienteToKimai } from '@/lib/kimai';

// POST - Sincronizar manualmente un cliente hacia Kimai (disparado desde la UI)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await checkAuth(request, ['admin', 'user']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (!kimaiEnabled()) {
    return NextResponse.json(
      { error: 'Kimai no está configurado (faltan KIMAI_URL o KIMAI_API_TOKEN)' },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const result = await syncClienteToKimai(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Kimai sync manual:', error);
    const msg = error instanceof Error ? error.message : 'Error al sincronizar con Kimai';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
