import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

const CLOCKIFY_API_BASE = 'https://api.clockify.me/api/v1';

export async function POST(request: NextRequest) {
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
    // Fetch tags from Clockify
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
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Respuesta inválida de Clockify' }, { status: 500 });
    }

    const results = [];

    for (const tag of tags) {
      const { id: clockifyTagId, name: clockifyTagName } = tag;
      
      if (!clockifyTagId || !clockifyTagName) continue;

      // Upsert tag
      const upserted = await prisma.clockifyTag.upsert({
        where: { clockifyTagId },
        update: { clockifyTagName },
        create: {
          clockifyTagId,
          clockifyTagName,
          workspaceId,
        },
      });

      results.push(upserted);
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      tags: results,
    });
  } catch (error) {
    console.error('Error syncing Clockify tags:', error);
    return NextResponse.json({ error: 'Error al sincronizar tags' }, { status: 500 });
  }
}
