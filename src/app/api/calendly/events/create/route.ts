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

// POST - Crear un evento programado
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const token = await getCalendlyClient();
    const body = await request.json();
    const { eventTypeUri, inviteeEmail, inviteeName, startTime, timezone = 'America/Santiago' } = body;

    if (!eventTypeUri || !inviteeEmail || !startTime) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: eventTypeUri, inviteeEmail, startTime' },
        { status: 400 }
      );
    }

    // Obtener el tipo de evento para saber su duración
    const eventTypeRes = await fetch(`${eventTypeUri}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!eventTypeRes.ok) {
      throw new Error('Error al obtener tipo de evento');
    }

    const eventTypeData = await eventTypeRes.json();
    const duration = eventTypeData.resource.duration || 30; // minutos por defecto
    
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // Usar el endpoint de Event Invitee para crear el evento programado
    // Este endpoint requiere un plan de pago de Calendly
    const createInviteeRes = await fetch(`${CALENDLY_API_BASE}/event_invitees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventTypeUri,
        email: inviteeEmail,
        name: inviteeName || inviteeEmail,
        start_time: startDate.toISOString(),
        timezone: timezone,
      }),
    });

    if (!createInviteeRes.ok) {
      const errorData = await createInviteeRes.json();
      
      // Si el endpoint no está disponible (plan gratuito), crear enlace de programación
      if (createInviteeRes.status === 403 || createInviteeRes.status === 404) {
        const schedulingLinkRes = await fetch(`${CALENDLY_API_BASE}/scheduling_links`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: eventTypeUri,
            owner_type: 'EventType',
          }),
        });

        if (schedulingLinkRes.ok) {
          const linkData = await schedulingLinkRes.json();
          return NextResponse.json({
            success: true,
            message: 'Enlace de programación creado. Comparte este enlace con el invitado para que confirme la cita.',
            schedulingLink: linkData.resource.booking_url,
            note: 'Nota: Para crear eventos directamente necesitas un plan de pago de Calendly',
          });
        }
      }
      
      throw new Error(errorData.message || 'Error al crear evento. Verifica que tengas un plan de pago de Calendly.');
    }

    const inviteeData = await createInviteeRes.json();

    return NextResponse.json({
      success: true,
      event: inviteeData.resource,
      message: 'Evento creado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al crear evento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear evento' },
      { status: 500 }
    );
  }
}
