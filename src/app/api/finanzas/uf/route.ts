import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

const CACHE_KEY = 'valorUF';
const CACHE_TS_KEY = 'valorUFAt';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const ok = await checkAuth(request);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const [cached, cachedAt] = await Promise.all([
      prisma.configValor.findUnique({ where: { clave: CACHE_KEY } }),
      prisma.configValor.findUnique({ where: { clave: CACHE_TS_KEY } }),
    ]);

    const isStale = !cached || !cachedAt ||
      (Date.now() - new Date(cachedAt.valor).getTime()) > CACHE_TTL_MS;

    if (!isStale && cached) {
      return NextResponse.json({ valor: Number(cached.valor), fromCache: true });
    }

    // Fetch from mindicador.cl
    const res = await fetch('https://mindicador.cl/api/uf', { next: { revalidate: 0 } });
    if (!res.ok) {
      // Return cached if available even if stale
      if (cached) return NextResponse.json({ valor: Number(cached.valor), fromCache: true });
      return NextResponse.json({ error: 'No se pudo obtener el valor de la UF' }, { status: 503 });
    }

    const data = await res.json();
    const valor = data?.serie?.[0]?.valor;
    if (!valor) {
      if (cached) return NextResponse.json({ valor: Number(cached.valor), fromCache: true });
      return NextResponse.json({ error: 'Respuesta inválida de mindicador.cl' }, { status: 503 });
    }

    // Update cache
    await prisma.$transaction([
      prisma.configValor.upsert({
        where: { clave: CACHE_KEY },
        update: { valor: String(valor) },
        create: { clave: CACHE_KEY, valor: String(valor) },
      }),
      prisma.configValor.upsert({
        where: { clave: CACHE_TS_KEY },
        update: { valor: new Date().toISOString() },
        create: { clave: CACHE_TS_KEY, valor: new Date().toISOString() },
      }),
    ]);

    return NextResponse.json({ valor: Number(valor), fromCache: false });
  } catch (error) {
    console.error('Error UF:', error);
    return NextResponse.json({ error: 'Error al obtener UF' }, { status: 500 });
  }
}
