import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PRECIO_HORA_NORMAL = 50000; // CLP, usar desde config después
const PRECIO_HORA_FUERA_HORARIO = 75000; // CLP

interface ClockifyWebhookEvent {
  eventType: string;
  timeEntry: {
    id: string;
    description: string;
    duration: number; // milliseconds
    start: string;
    end: string;
    projectId: string;
    taskId: string;
    billable: boolean;
    status: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Validar X-Clockify-Signature header
    const signature = request.headers.get('x-clockify-signature');
    // if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });

    const event: ClockifyWebhookEvent = await request.json();

    // Solo procesar TIME_ENTRY_UPDATED
    if (event.eventType !== 'TIME_ENTRY_UPDATED') {
      return NextResponse.json({ success: true, skipped: 'Not a TIME_ENTRY_UPDATED event' });
    }

    const { timeEntry } = event;
    if (!timeEntry || !timeEntry.projectId) {
      return NextResponse.json({ error: 'Invalid time entry data' }, { status: 400 });
    }

    // Buscar cliente por clockifyProjectId
    const proyecto = await prisma.proyecto.findFirst({
      where: { clockifyProjectId: timeEntry.projectId },
      include: { cliente: true },
    });

    if (!proyecto || !proyecto.cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado para este proyecto Clockify' },
        { status: 404 }
      );
    }

    const cliente = proyecto.cliente;
    const horas = timeEntry.duration / 3600000; // convertir ms a horas

    // Buscar o crear ClockifyTaskTipo
    let taskTipo = await prisma.clockifyTaskTipo.findUnique({
      where: { clockifyTaskId: timeEntry.taskId },
    });

    if (!taskTipo && timeEntry.taskId) {
      // Crear con tipo por defecto "habil"
      taskTipo = await prisma.clockifyTaskTipo.create({
        data: {
          clockifyTaskId: timeEntry.taskId,
          clockifyProjectId: timeEntry.projectId,
          nombre: timeEntry.description || 'Sin nombre',
          tipoHora: 'habil',
        },
      });
    }

    const tipoCobro = taskTipo?.tipoHora || 'habil';
    const precioUnitario = tipoCobro === 'inhabil' ? PRECIO_HORA_FUERA_HORARIO : PRECIO_HORA_NORMAL;
    const montoTotal = horas * precioUnitario;

    // Validar fecha: usar end si existe, si no start, si no new Date()
    const fechaRegistro = timeEntry.end 
      ? new Date(timeEntry.end)
      : timeEntry.start 
        ? new Date(timeEntry.start)
        : new Date();

    // Crear FacturableEntry
    const entry = await prisma.facturableEntry.create({
      data: {
        clockifyTaskId: timeEntry.id,
        clienteId: cliente.id,
        descripcion: timeEntry.description || 'Sin descripción',
        horas: parseFloat(horas.toFixed(2)),
        tipoCobro,
        precioUnitario: precioUnitario,
        montoTotal: parseFloat(montoTotal.toFixed(2)),
        estado: 'registrado',
        fechaRegistro,
      },
    });

    return NextResponse.json({ success: true, entryId: entry.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook';
    console.error('Clockify webhook error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
