import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

// Inicialización lazy de Resend (igual que en contacto)
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no configurada');
  }
  return new Resend(apiKey);
}

export async function POST(req: Request) {
  try {
    const { clienteId, destinatario, asunto, mensaje } = await req.json();

    if (!clienteId) {
      return NextResponse.json(
        { error: 'Cliente requerido' },
        { status: 400 }
      );
    }

    if (!destinatario) {
      return NextResponse.json(
        { error: 'Email destinatario requerido' },
        { status: 400 }
      );
    }

    // Verificar API key antes de continuar
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'API key de Resend no configurada' },
        { status: 500 }
      );
    }

    // Obtener cliente con sus accesos
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        accesos: {
          orderBy: { tipo: 'asc' }
        }
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (cliente.accesos.length === 0) {
      return NextResponse.json(
        { error: 'El cliente no tiene accesos registrados' },
        { status: 400 }
      );
    }

    // Generar HTML del correo
    const tiposLabels: Record<string, string> = {
      hosting: '🌐 Hosting',
      cpanel: '⚙️ cPanel',
      email: '📧 Email',
      ftp: '📁 FTP',
      ssh: '💻 SSH',
      db: '🗄️ Base de Datos',
      vpn: '🔒 VPN',
      cloud: '☁️ Cloud',
      otro: '📌 Otro',
    };

    const accesosHTML = cliente.accesos.map(acceso => `
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #7AA228;">
        <h3 style="margin: 0 0 8px 0; color: #224859; font-size: 16px;">
          ${tiposLabels[acceso.tipo] || acceso.tipo} - ${acceso.nombre}
        </h3>
        ${acceso.url ? `<p style="margin: 4px 0; color: #475569;"><strong>URL:</strong> ${acceso.url}${acceso.puerto ? `:${acceso.puerto}` : ''}</p>` : ''}
        ${acceso.usuario ? `<p style="margin: 4px 0; color: #475569;"><strong>Usuario:</strong> ${acceso.usuario}</p>` : ''}
        ${acceso.password ? `<p style="margin: 4px 0; color: #475569;"><strong>Contraseña:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${acceso.password}</code></p>` : ''}
        ${acceso.notas ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px; font-style: italic;">${acceso.notas}</p>` : ''}
      </div>
    `).join('');

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f0f0; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: #224859; padding: 28px 30px; text-align: center;">
            <p style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -1px;">ITS<span style="color: #7AA228;">-Dev</span></p>
            <p style="color: rgba(255,255,255,0.7); font-size: 11px; letter-spacing: 2px; margin: 4px 0 0;">SOLUCIONES TECNOLÓGICAS</p>
          </div>
          
          <!-- Title -->
          <div style="background: #7AA228; padding: 16px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 600;">Informe de Accesos</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 14px;">${cliente.razonSocial}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 24px 30px;">
            ${mensaje ? `<p style="color: #475569; margin-bottom: 24px; white-space: pre-wrap; background: #f8fafc; padding: 16px; border-radius: 8px;">${mensaje}</p>` : ''}
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
              A continuación se detallan los accesos asociados a su cuenta:
            </p>
            
            ${accesosHTML}
            
            <div style="margin-top: 24px; padding: 16px; background: #fef3cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 13px; margin: 0;">
                <strong>⚠️ Importante:</strong> Esta información es confidencial. Por favor, guárdela en un lugar seguro y no la comparta con terceros no autorizados.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #224859; padding: 18px 30px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0;">
              <strong>ItsDev</strong> - Soluciones Tecnológicas que Funcionan
            </p>
            <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 6px 0 0;">
              📧 contacto@itsdev.cl · 📱 +56 9 7536 2904
            </p>
            <p style="color: rgba(255,255,255,0.4); font-size: 10px; margin: 8px 0 0;">
              Generado el ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar correo con Resend (misma config que contacto)
    const resend = getResendClient();
    console.log('📧 Enviando informe de accesos a:', destinatario);
    
    const { data, error } = await resend.emails.send({
      from: 'ItsDev <noreply@sender.itsdev.cl>',
      to: [destinatario],
      subject: asunto || `🔐 Informe de Accesos - ${cliente.razonSocial}`,
      html: emailHTML,
    });

    if (error) {
      console.error('❌ Error al enviar informe:', error);
      return NextResponse.json(
        { error: 'Error al enviar el correo: ' + error.message },
        { status: 500 }
      );
    }

    console.log('✅ Informe enviado:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'Correo enviado correctamente',
      emailId: data?.id 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// GET para obtener datos del cliente y sus accesos (para generar PDF en cliente)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('clienteId');

    if (!clienteId) {
      return NextResponse.json(
        { error: 'Cliente requerido' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        accesos: {
          orderBy: { tipo: 'asc' }
        }
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
