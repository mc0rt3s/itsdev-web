import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const CLOCKIFY_API_BASE = 'https://api.clockify.me/api/v1';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const apiKey = process.env.CLOCKIFY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Clockify API key no configurada' }, { status: 500 });

  try {
    const res = await fetch(`${CLOCKIFY_API_BASE}/workspaces`, {
      headers: { 'X-Api-Key': apiKey },
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err || 'Error al obtener workspaces' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clockify workspaces:', error);
    return NextResponse.json({ error: 'Error al conectar con Clockify' }, { status: 500 });
  }
}
