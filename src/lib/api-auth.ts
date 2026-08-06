import { auth } from './auth';
import { NextRequest } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

// Token secreto para acceso desde Estrella / app Electron
// Agregar ESTRELLA_API_TOKEN=tu-token-secreto en el .env
const ESTRELLA_TOKEN = process.env.ESTRELLA_API_TOKEN;

/**
 * Comparación de strings que no depende del tiempo ni de la longitud para
 * evitar ataques de timing side-channel contra el token de Estrella.
 * Se comparan hashes SHA-256 de ambos lados (longitud fija de 32 bytes).
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Verifica si la request está autenticada.
 * Acepta:
 * 1. Sesión NextAuth válida (acceso web normal)
 * 2. Header Authorization: Bearer <ESTRELLA_API_TOKEN> (acceso desde Estrella/Electron)
 */
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  // Opción 1: token de Estrella en el header
  if (request && ESTRELLA_TOKEN) {
    const authHeader = request.headers.get('authorization');
    if (safeEqual(authHeader ?? '', `Bearer ${ESTRELLA_TOKEN}`)) {
      return true;
    }
  }

  // Opción 2: sesión NextAuth normal
  const session = await auth();
  return !!session;
}

/**
 * Reemplaza el chequeo de session en las routes existentes.
 * Uso: const ok = await checkAuth(request);
 * Uso con roles: const ok = await checkAuth(request, ['admin', 'user']);
 * El token de Estrella siempre pasa (equivale a admin).
 */
export async function checkAuth(request?: NextRequest, allowedRoles?: string[]) {
  if (request && ESTRELLA_TOKEN) {
    const authHeader = request.headers.get('authorization');
    if (safeEqual(authHeader ?? '', `Bearer ${ESTRELLA_TOKEN}`)) return true;
  }
  const session = await auth();
  if (!session?.user) return null;
  if (allowedRoles && !allowedRoles.includes(session.user.role)) return null;
  return true;
}

/**
 * Autenticación + sesión NextAuth (necesaria cuando se usa session.user).
 * El token de Estrella no devuelve sesión; en esas rutas usar solo checkAuth.
 */
export async function requireSession(request?: NextRequest) {
  const ok = await isAuthenticated(request);
  if (!ok) return null;
  const session = await auth();
  if (!session?.user) return null;
  return session;
}