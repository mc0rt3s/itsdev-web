import { Resend } from 'resend';

interface NotifyCotizacionEstadoParams {
    cotizacionId: string;
    numero: string;
    estadoAnterior: string;
    estadoNuevo: string;
    canal: 'panel_admin' | 'cliente_link' | 'sistema';
    actor?: string;
}

function getNotifyRecipients() {
    const raw = process.env.COTIZACION_NOTIFY_EMAILS || 'contacto@itsdev.cl';
    return raw
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);
}

export async function notifyCotizacionEstadoChange(params: NotifyCotizacionEstadoParams): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const recipients = getNotifyRecipients();
    if (!recipients.length) return;

    const resend = new Resend(apiKey);
    const title = `Cotización ${params.numero}: ${params.estadoAnterior} -> ${params.estadoNuevo}`;
    const actorLine = params.actor ? `Actor: ${params.actor}` : 'Actor: cliente (link)';

    const { error } = await resend.emails.send({
        from: 'ITSDev Alertas <noreply@sender.itsdev.cl>',
        to: recipients,
        replyTo: 'contacto@itsdev.cl',
        subject: `[Cotizaciones] ${title}`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 680px;">
        <h2 style="margin: 0 0 12px;">Cambio de estado en cotización</h2>
        <p style="margin: 0 0 8px;"><strong>Número:</strong> ${params.numero}</p>
        <p style="margin: 0 0 8px;"><strong>ID:</strong> ${params.cotizacionId}</p>
        <p style="margin: 0 0 8px;"><strong>Estado:</strong> ${params.estadoAnterior} → ${params.estadoNuevo}</p>
        <p style="margin: 0 0 8px;"><strong>Canal:</strong> ${params.canal}</p>
        <p style="margin: 0 0 16px;"><strong>${actorLine}</strong></p>
      </div>
    `,
    });

    if (error) {
        console.error('No se pudo enviar alerta de cotización:', error);
    }
}
