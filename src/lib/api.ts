import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { auth } from '@/lib/auth';

interface AuthOptions {
  roles?: string[];
}

interface AuthSuccess {
  session: Session;
}

interface AuthFailure {
  response: NextResponse;
}

export async function requireAuth(options?: AuthOptions): Promise<AuthSuccess | AuthFailure> {
  const session = (await auth()) as Session | null;

  if (!session) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }

  if (options?.roles && !options.roles.includes(session.user.role)) {
    return { response: NextResponse.json({ error: 'No tienes permisos' }, { status: 403 }) };
  }

  return { session };
}

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      response: NextResponse.json(
        { error: result.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
