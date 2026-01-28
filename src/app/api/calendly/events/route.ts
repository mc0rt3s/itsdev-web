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

// GET - Obtener eventos/eventos programados
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const token = await getCalendlyClient();
    const { searchParams } = new URL(request.url);
    const count = searchParams.get('count') || '20';
    const minStartTime = searchParams.get('min_start_time');
    const maxStartTime = searchParams.get('max_start_time');

    // Primero obtener el usuario de Calendly
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

    // Construir URL para obtener eventos programados
    let eventsUrl = `${CALENDLY_API_BASE}/event_types?user=${encodeURIComponent(userUri)}&count=${count}`;
    
    // Obtener eventos programados (scheduled events)
    let scheduledEventsUrl = `${CALENDLY_API_BASE}/scheduled_events?user=${encodeURIComponent(userUri)}&count=${count}`;
    if (minStartTime) {
      scheduledEventsUrl += `&min_start_time=${minStartTime}`;
    }
    if (maxStartTime) {
      scheduledEventsUrl += `&max_start_time=${maxStartTime}`;
    }

    const [eventTypesRes, scheduledEventsRes] = await Promise.all([
      fetch(eventsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch(scheduledEventsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    ]);

    if (!eventTypesRes.ok || !scheduledEventsRes.ok) {
      throw new Error('Error al obtener eventos de Calendly');
    }

    const [eventTypesData, scheduledEventsData] = await Promise.all([
      eventTypesRes.json(),
      scheduledEventsRes.json(),
    ]);

    return NextResponse.json({
      eventTypes: eventTypesData.collection || [],
      scheduledEvents: scheduledEventsData.collection || [],
    });
  } catch (error: any) {
    console.error('Error en API de Calendly:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener eventos de Calendly' },
      { status: 500 }
    );
  }
}
