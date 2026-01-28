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

// GET - Obtener el próximo evento programado
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const token = await getCalendlyClient();
    const now = new Date().toISOString();

    // Obtener usuario de Calendly
    const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Error al obtener usuario de Calendly');
    }

    const userData = await userResponse.json();
    const userUri = userData.resource.uri;

    // Obtener próximos eventos programados (solo futuros)
    const scheduledEventsUrl = `${CALENDLY_API_BASE}/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${now}&count=1&sort=start_time:asc`;

    const scheduledEventsRes = await fetch(scheduledEventsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!scheduledEventsRes.ok) {
      throw new Error('Error al obtener próximos eventos');
    }

    const scheduledEventsData = await scheduledEventsRes.json();
    const nextEvent = scheduledEventsData.collection?.[0] || null;

    if (!nextEvent) {
      return NextResponse.json({ event: null });
    }

    // Obtener detalles del evento (invitados, etc.)
    const eventDetailsUrl = `${CALENDLY_API_BASE}/scheduled_events/${nextEvent.uri.split('/').pop()}`;
    const eventDetailsRes = await fetch(eventDetailsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let eventDetails = null;
    if (eventDetailsRes.ok) {
      const detailsData = await eventDetailsRes.json();
      eventDetails = detailsData.resource;
    }

    return NextResponse.json({
      event: {
        ...nextEvent,
        details: eventDetails,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener próximo evento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener próximo evento' },
      { status: 500 }
    );
  }
}
