import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

const CLOCKIFY_API_BASE = 'https://api.clockify.me/api/v1';

export async function GET(request: NextRequest) {
  const ok = await checkAuth(request, ['admin']);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const apiKey = process.env.CLOCKIFY_API_KEY;
  const workspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
  
  if (!apiKey || !workspaceId) {
    return NextResponse.json(
      { error: 'Clockify API key o workspace ID no configurados' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${CLOCKIFY_API_BASE}/workspaces/${workspaceId}/tags`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Clockify tags error:', res.status, err);
      return NextResponse.json(
        { error: err || 'Error al obtener tags de Clockify' },
        { status: res.status }
      );
    }

    const tags = await res.json();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching Clockify tags:', error);
    return NextResponse.json({ error: 'Error al obtener tags' }, { status: 500 });
  }
}
