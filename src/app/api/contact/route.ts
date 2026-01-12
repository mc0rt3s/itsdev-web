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

// Inicialización lazy de Resend (evita error en build time)
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no configurada');
  }
  return new Resend(apiKey);
}

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

    // En desarrollo sin API key, simular éxito
    if (!process.env.RESEND_API_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email simulado (sin API key):', data);
        return NextResponse.json({ 
          success: true, 
          message: 'Mensaje recibido (modo desarrollo)' 
        });
      }
      console.error('RESEND_API_KEY no configurada');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Obtener cliente de Resend
    const resend = getResendClient();

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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .logo-section { background: #224859; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .logo { display: inline-block; }
          .logo-icon { display: inline-block; background: #7AA228; color: white; font-weight: bold; font-size: 24px; width: 50px; height: 50px; line-height: 50px; border-radius: 12px; text-align: center; vertical-align: middle; }
          .logo-text { display: inline-block; vertical-align: middle; margin-left: 12px; }
          .logo-text h2 { color: white; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -1px; }
          .logo-text p { color: #7AA228; margin: 0; font-size: 12px; letter-spacing: 1px; }
          .header { background: linear-gradient(135deg, #7AA228 0%, #5a8a1a 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 26px; }
          .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; }
          .content { background: #f8f9fa; padding: 30px; }
          .message { background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #7AA228; }
          .cta { text-align: center; margin: 30px 0; }
          .cta a { display: inline-block; background: #25D366; color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; }
          .footer { background: #224859; padding: 25px; border-radius: 0 0 12px 12px; text-align: center; color: rgba(255,255,255,0.8); font-size: 14px; }
          .footer a { color: #7AA228; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-section">
            <div class="logo">
              <span class="logo-icon">&lt;/&gt;</span>
              <div class="logo-text">
                <h2>ITS-Dev</h2>
                <p>SOLUCIONES TECNOLÓGICAS</p>
              </div>
            </div>
          </div>
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

    // Email 1: Notificación al equipo de ItsDev
    console.log('📧 Enviando email al equipo...');
    const { data: teamEmail, error: teamError } = await resend.emails.send({
      from: 'ItsDev Web <noreply@sender.itsdev.cl>',
      to: ['contacto@itsdev.cl'],
      replyTo: data.email,
      subject: `🚀 Nuevo contacto: ${data.nombre}${data.empresa ? ` - ${data.empresa}` : ''}`,
      html: teamEmailHtml,
    });

    if (teamError) {
      console.error('❌ Error enviando email al equipo:', teamError);
    } else {
      console.log('✅ Email al equipo enviado:', teamEmail);
    }

    // Email 2: Confirmación al usuario
    console.log('📧 Enviando email de confirmación al usuario...');
    const { data: userEmail, error: userError } = await resend.emails.send({
      from: 'ItsDev <noreply@sender.itsdev.cl>',
      to: [data.email],
      subject: '✅ Recibimos tu mensaje - ItsDev',
      html: userEmailHtml,
    });

    if (userError) {
      console.error('❌ Error enviando email al usuario:', userError);
    } else {
      console.log('✅ Email al usuario enviado:', userEmail);
    }

    // Si ambos fallaron, reportar error
    if (teamError && userError) {
      return NextResponse.json(
        { error: 'Error al enviar los mensajes' },
        { status: 500 }
      );
    }

    // Log resumen
    console.log('📧 Resumen de envío:', {
      equipo: teamError ? 'FALLÓ' : 'OK',
      usuario: userError ? 'FALLÓ' : 'OK',
      contacto: data.email,
    });

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
