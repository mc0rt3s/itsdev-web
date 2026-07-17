import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  // Rate limiting en el endpoint de login (NextAuth credentials callback)
  if (request.method === 'POST' && request.nextUrl.pathname === '/api/auth/callback/credentials') {
    // Obtener IP del cliente (soporta proxies como Vercel, Cloudflare, etc.)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown';

    // Rate limit: 10 intentos por 15 minutos (900 segundos)
    const rateLimitResult = checkRateLimit({
      key: `login:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000, // 15 minutos
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos de login. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfterSeconds.toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/callback/credentials'],
};
