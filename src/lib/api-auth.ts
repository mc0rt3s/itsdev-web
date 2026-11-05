import { auth } from './auth';
import { NextRequest } from 'next/server';

/**
 * Verifica si la request está autenticada (sesión NextAuth).
 */
export async function isAuthenticated(_request?: NextRequest): Promise<boolean> {
  const session = await auth();
  return !!session;
}

/**
 * Reemplaza el chequeo de session en las routes existentes.
 * Uso: const ok = await checkAuth(request);
 * Uso con roles: const ok = await checkAuth(request, ['admin', 'user']);
 */
export async function checkAuth(_request?: NextRequest, allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user) return null;
  if (allowedRoles && !allowedRoles.includes(session.user.role)) return null;
  return true;
}

/**
 * Autenticación + sesión NextAuth (necesaria cuando se usa session.user).
 */
export async function requireSession(request?: NextRequest) {
  const ok = await isAuthenticated(request);
  if (!ok) return null;
  const session = await auth();
  if (!session?.user) return null;
  return session;
}
