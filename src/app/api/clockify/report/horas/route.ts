import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

const CLOCKIFY_REPORTS_BASE = 'https://reports.api.clockify.me/v1';

interface ClockifyTimeEntry {
  _id?: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  project?: { name?: string };
  taskId?: string;
  taskName?: string;
  task?: { name?: string };
  userId?: string;
  userName?: string;
  user?: { name?: string };
  timeInterval?: { start?: string; end?: string; duration?: string };
  start?: string;
  end?: string;
  duration?: number;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const apiKey = process.env.CLOCKIFY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Clockify API key no configurada' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId');
  const workspaceId = searchParams.get('workspaceId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!clienteId || !workspaceId || !start || !end) {
    return NextResponse.json(
      { error: 'Faltan parámetros: clienteId, workspaceId, start, end' },
      { status: 400 }
    );
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { proyectos: { where: { NOT: { clockifyProjectId: null } } } },
    });
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

    const projectIds = cliente.proyectos
      .map((p) => p.clockifyProjectId)
      .filter((id): id is string => id != null);
    if (projectIds.length === 0) {
      return NextResponse.json({
        entries: [],
        resumen: { horasHabil: 0, horasInhabil: 0, totalHoras: 0 },
        message: 'El cliente no tiene proyectos vinculados a Clockify',
      });
    }

    const taskTipos = await prisma.clockifyTaskTipo.findMany();
    const taskTipoMap = new Map(taskTipos.map((t) => [t.clockifyTaskId, t.tipoHora]));

    const dateRangeStart = `${start}T00:00:00.000Z`;
    const dateRangeEnd = `${end}T23:59:59.999Z`;

    const allEntries: ClockifyTimeEntry[] = [];
    let page = 1;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const body = {
        dateRangeStart,
        dateRangeEnd,
        exportType: 'JSON',
        detailedFilter: { page, pageSize, sortColumn: 'DATE' },
        projects: { contains: 'CONTAINS', ids: projectIds, status: 'ACTIVE' as const },
      };

      const res = await fetch(`${CLOCKIFY_REPORTS_BASE}/workspaces/${workspaceId}/reports/detailed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Clockify report error:', res.status, err);
        return NextResponse.json(
          { error: err || 'Error al obtener reporte de Clockify' },
          { status: res.status }
        );
      }

      const data = (await res.json()) as { timeentries?: ClockifyTimeEntry[] };
      const entries = data.timeentries ?? [];
      allEntries.push(...entries);
      hasMore = entries.length === pageSize;
      page++;
    }

    const projectNames = new Map<string, string>(
      cliente.proyectos
        .filter((p) => p.clockifyProjectId)
        .map((p) => [p.clockifyProjectId!, p.nombre])
    );

    const entriesWithTipo = allEntries.map((entry) => {
      const durationStr = entry.timeInterval?.duration ?? entry.duration;
      let seconds = 0;
      if (typeof durationStr === 'number') seconds = durationStr;
      else if (typeof durationStr === 'string' && durationStr.startsWith('PT')) {
        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          seconds = (parseInt(match[1] || '0', 10) * 3600) + (parseInt(match[2] || '0', 10) * 60) + parseInt(match[3] || '0', 10);
        }
      }
      const horas = seconds / 3600;
      const taskId = entry.taskId ?? '';
      const tipoHora = taskTipoMap.get(taskId) ?? 'habil';
      const projectName =
        entry.projectName ??
        entry.project?.name ??
        projectNames.get(entry.projectId ?? '') ??
        entry.projectId ??
        '';
      const description = typeof entry.description === 'string' ? entry.description : '';
      const taskName = entry.taskName ?? entry.task?.name ?? '';
      const userName = entry.userName ?? entry.user?.name ?? '';
      const start = entry.timeInterval?.start ?? entry.start;
      const end = entry.timeInterval?.end ?? entry.end;
      return {
        id: entry._id,
        description,
        projectId: entry.projectId,
        projectName,
        taskId: entry.taskId,
        taskName,
        userName,
        start,
        end,
        duration: entry.timeInterval?.duration ?? entry.duration,
        horas,
        tipoHora,
      };
    });

    const horasHabil = entriesWithTipo.filter((e) => e.tipoHora === 'habil').reduce((s, e) => s + e.horas, 0);
    const horasInhabil = entriesWithTipo.filter((e) => e.tipoHora === 'inhabil').reduce((s, e) => s + e.horas, 0);
    const totalHoras = horasHabil + horasInhabil;

    return NextResponse.json({
      entries: entriesWithTipo,
      resumen: { horasHabil, horasInhabil, totalHoras },
    });
  } catch (error) {
    console.error('Error reporte horas:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}
