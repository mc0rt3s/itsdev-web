import { auth } from './auth';
import { NextRequest } from 'next/server';

// Token secreto para acceso desde Estrella / app Electron
// Agregar ESTRELLA_API_TOKEN=tu-token-secreto en el .env
const ESTRELLA_TOKEN = process.env.ESTRELLA_API_TOKEN;

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
    if (authHeader === `Bearer ${ESTRELLA_TOKEN}`) {
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
 */
export async function checkAuth(request?: NextRequest) {
  const ok = await isAuthenticated(request);
  if (!ok) return null;
  return true;
}