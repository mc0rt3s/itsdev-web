import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const CALENDLY_API_BASE = 'https://api.calendly.com';

async function getCalendlyClient() {
  const token = process.env.CALENDLY_API_TOKEN;
  if (!token) {
    throw new Error('CALENDLY_API_TOKEN no configurada');
  }
  return token;
}

// POST - Cancelar un evento programado
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const token = await getCalendlyClient();
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Obtener el evento primero para verificar que existe
    const eventRes = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!eventRes.ok) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Cancelar el evento
    const cancelRes = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${id}/cancellation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: reason || 'Cancelado desde el panel de administración',
      }),
    });

    if (!cancelRes.ok) {
      const errorData = await cancelRes.json();
      throw new Error(errorData.message || 'Error al cancelar evento');
    }

    const cancelData = await cancelRes.json();

    return NextResponse.json({
      success: true,
      event: cancelData.resource,
    });
  } catch (error: any) {
    console.error('Error al cancelar evento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cancelar evento' },
      { status: 500 }
    );
  }
}
