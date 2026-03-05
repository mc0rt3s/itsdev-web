import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const CLOCKIFY_API_BASE = 'https://api.clockify.me/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const apiKey = process.env.CLOCKIFY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Clockify API key no configurada' }, { status: 500 });

  const { workspaceId } = await params;
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  try {
    let url = `${CLOCKIFY_API_BASE}/workspaces/${workspaceId}/projects?archived=false`;
    if (clientId) url += `&clients=${clientId}`;

    const res = await fetch(url, {
      headers: { 'X-Api-Key': apiKey },
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err || 'Error al obtener proyectos' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clockify projects:', error);
    return NextResponse.json({ error: 'Error al conectar con Clockify' }, { status: 500 });
  }
}
