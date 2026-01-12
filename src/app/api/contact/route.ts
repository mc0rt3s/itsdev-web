import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Interfaz para los datos del formulario
interface ContactFormData {
  nombre: string;
  empresa?: string;
  email: string;
  telefono?: string;
  mensaje: string;
}

// Validación simple de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();

    // Validaciones
    if (!data.nombre || data.nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    if (!data.email || !isValidEmail(data.email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (!data.mensaje || data.mensaje.trim().length < 10) {
      return NextResponse.json(
        { error: 'El mensaje es requerido (mínimo 10 caracteres)' },
        { status: 400 }
      );
    }

    // Verificar que tenemos la API key de Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no configurada');
      // En desarrollo, simular éxito
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email simulado:', data);
        return NextResponse.json({ 
          success: true, 
          message: 'Mensaje recibido (modo desarrollo)' 
        });
      }
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Email HTML para el equipo de ItsDev
    const teamEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7AA228 0%, #224859 100%); padding: 30px; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
          .field { margin-bottom: 20px; }
          .field-label { font-weight: 600; color: #224859; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .field-value { margin-top: 5px; padding: 12px; background: white; border-radius: 8px; border-left: 3px solid #7AA228; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 3px solid #7AA228; white-space: pre-wrap; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .badge { display: inline-block; background: #7AA228; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Nuevo mensaje de contacto</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Nombre</div>
              <div class="field-value">${data.nombre}</div>
            </div>
            
            ${data.empresa ? `
            <div class="field">
              <div class="field-label">Empresa</div>
              <div class="field-value">${data.empresa}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
            </div>
            
            ${data.telefono ? `
            <div class="field">
              <div class="field-label">Teléfono</div>
              <div class="field-value"><a href="tel:${data.telefono}">${data.telefono}</a></div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="field-label">Mensaje</div>
              <div class="message-box">${data.mensaje}</div>
            </div>
          </div>
          <div class="footer">
            <span class="badge">itsdev.cl</span>
            <p>Este mensaje fue enviado desde el formulario de contacto</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email de confirmación para el usuario
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7AA228 0%, #224859 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; }
          .message { background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; }
          .cta { text-align: center; margin: 30px 0; }
          .cta a { display: inline-block; background: #25D366; color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; }
          .footer { background: #224859; padding: 25px; border-radius: 0 0 12px 12px; text-align: center; color: rgba(255,255,255,0.8); font-size: 14px; }
          .footer a { color: #7AA228; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Gracias por contactarnos!</h1>
            <p>Hemos recibido tu mensaje</p>
          </div>
          <div class="content">
            <div class="message">
              <p>Hola <strong>${data.nombre}</strong>,</p>
              <p>Gracias por tu interés en ItsDev. Hemos recibido tu mensaje y nos pondremos en contacto contigo en las próximas <strong>24 horas hábiles</strong>.</p>
              <p>Si tu consulta es urgente, puedes contactarnos directamente por WhatsApp:</p>
            </div>
            <div class="cta">
              <a href="https://wa.me/56975362904?text=Hola%2C%20acabo%20de%20enviar%20un%20formulario%20desde%20itsdev.cl">💬 Escribir por WhatsApp</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>ItsDev</strong> - Soluciones Tecnológicas que Funcionan</p>
            <p>📧 <a href="mailto:contacto@itsdev.cl">contacto@itsdev.cl</a> | 📱 +56 9 7536 2904</p>
            <p><a href="https://itsdev.cl">www.itsdev.cl</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar ambos emails usando batch
    const { data: emailResult, error } = await resend.batch.send([
      {
        // Email al equipo de ItsDev
        from: 'ItsDev Web <onboarding@resend.dev>',
        to: ['contacto@itsdev.cl'],
        replyTo: data.email,
        subject: `🚀 Nuevo contacto: ${data.nombre}${data.empresa ? ` - ${data.empresa}` : ''}`,
        html: teamEmailHtml,
      },
      {
        // Email de confirmación al usuario
        from: 'ItsDev <onboarding@resend.dev>',
        to: [data.email],
        subject: '✅ Recibimos tu mensaje - ItsDev',
        html: userEmailHtml,
      },
    ]);

    if (error) {
      console.error('Error de Resend:', error);
      return NextResponse.json(
        { error: 'Error al enviar el mensaje' },
        { status: 500 }
      );
    }

    console.log('📧 Emails enviados:', emailResult);

    return NextResponse.json({ 
      success: true, 
      message: 'Mensaje enviado correctamente' 
    });

  } catch (error) {
    console.error('Error en API de contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
