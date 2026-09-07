import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api';
import prisma from '@/lib/prisma';

const CLOCKIFY_API_BASE = 'https://api.clockify.me/api/v1';

interface ClockifyTimeEntry {
  id: string;
  description: string;
  timeInterval: {
    start: string;
    end: string;
    duration: string;
  };
  isLocked: boolean;
  billable: boolean;
  taskId?: string;
  projectId?: string;
}

interface MappedEntry {
  id: string;
  description: string;
  hours: number;
  start: string;
  end: string;
  billable: boolean;
  taskId?: string;
  projectId?: string;
  linkedToFacturable: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate admin role
  const auth = await requireAuth({ roles: ['admin'] });
  if ('response' in auth) return auth.response;

  const { id: clienteId } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  if (page < 1 || pageSize < 1 || pageSize > 100) {
    return NextResponse.json(
      { error: 'Invalid pagination params' },
      { status: 400 }
    );
  }

  try {
    // Fetch client and validate exists
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, clockifyClientId: true, razonSocial: true },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (!cliente.clockifyClientId) {
      return NextResponse.json(
        { error: 'Cliente no tiene vinculación con Clockify' },
        { status: 400 }
      );
    }

    // Get Clockify API key and workspace ID
    const apiKey = process.env.CLOCKIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clockify API key no configurada' },
        { status: 500 }
      );
    }

    const workspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Clockify workspace ID no configurado' },
        { status: 500 }
      );
    }

    // Query Clockify API for time entries
    // ponytail: using basic pagination via page/pageSize; Clockify may support cursor-based pagination for better performance
    const skip = (page - 1) * pageSize;
    const clockifyUrl = new URL(
      `${CLOCKIFY_API_BASE}/workspaces/${workspaceId}/time-entries`
    );
    clockifyUrl.searchParams.append('clients', cliente.clockifyClientId);
    clockifyUrl.searchParams.append('estimate', 'APPROVED');
    clockifyUrl.searchParams.append('user', 'all');
    clockifyUrl.searchParams.append('page-size', pageSize.toString());
    clockifyUrl.searchParams.append('page', page.toString());

    const clockifyRes = await fetch(clockifyUrl.toString(), {
      headers: { 'X-Api-Key': apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!clockifyRes.ok) {
      const errorText = await clockifyRes.text();
      console.error(
        `Clockify API error (${clockifyRes.status}):`,
        errorText
      );
      return NextResponse.json(
        { error: `Clockify API error: ${clockifyRes.status}` },
        { status: clockifyRes.status === 401 ? 401 : 500 }
      );
    }

    const entries: ClockifyTimeEntry[] = await clockifyRes.json();

    // Get all existing FacturableEntry records for this client
    const facturable = await prisma.facturableEntry.findMany({
      where: { clienteId },
      select: { clockifyTaskId: true },
    });
    const facturableTaskIds = new Set(facturable.map((f) => f.clockifyTaskId));

    // Map entries to simple format and enrich
    const mapped: MappedEntry[] = entries.map((e) => {
      const durationMs = parseDuration(e.timeInterval.duration);
      const hours = durationMs / (1000 * 60 * 60);

      return {
        id: e.id,
        description: e.description || '(sin descripción)',
        hours: parseFloat(hours.toFixed(2)),
        start: e.timeInterval.start,
        end: e.timeInterval.end,
        billable: e.billable,
        taskId: e.taskId,
        projectId: e.projectId,
        linkedToFacturable: facturableTaskIds.has(e.id),
      };
    });

    return NextResponse.json({
      entries: mapped,
      pagination: { page, pageSize, total: mapped.length },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al obtener tareas';
    console.error('GET /api/clientes/[id]/clockify-tasks:', message);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Timeout o error de conexión con Clockify' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Parse ISO 8601 duration (PT1H30M45S) to milliseconds
function parseDuration(duration: string): number {
  const regex =
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
  const match = duration.match(regex);

  if (!match) return 0;

  const days = parseInt(match[1] || '0');
  const hours = parseInt(match[2] || '0');
  const minutes = parseInt(match[3] || '0');
  const seconds = parseFloat(match[4] || '0');

  return (
    days * 86400000 +
    hours * 3600000 +
    minutes * 60000 +
    seconds * 1000
  );
}
