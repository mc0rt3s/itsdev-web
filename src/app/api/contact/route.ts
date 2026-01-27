import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/lib/schemas';

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

    const validationResult = contactSchema.safeParse(await request.json());

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f0f0f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: #224859; padding: 24px 30px; display: flex; align-items: center; }
          .logo-icon { background: #7AA228; color: white; font-weight: bold; font-size: 18px; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; text-align: center; display: inline-block; }
          .header-text { display: inline-block; margin-left: 15px; }
          .header-text h1 { color: white; margin: 0; font-size: 20px; }
          .header-text p { color: #7AA228; margin: 2px 0 0; font-size: 11px; letter-spacing: 1px; }
          .content { padding: 30px; }
          .contact-card { background: #f8f9fa; border-radius: 12px; padding: 24px; border-left: 4px solid #7AA228; }
          .contact-name { font-size: 22px; font-weight: 700; color: #224859; margin: 0 0 4px; }
          .contact-company { font-size: 14px; color: #7AA228; margin: 0 0 16px; font-weight: 500; }
          .contact-info { margin: 16px 0; }
          .contact-row { display: flex; align-items: center; margin: 8px 0; }
          .contact-icon { color: #7AA228; margin-right: 10px; font-size: 14px; }
          .contact-link { color: #224859; text-decoration: none; font-size: 15px; }
          .contact-link:hover { color: #7AA228; }
          .divider { height: 1px; background: #e0e0e0; margin: 20px 0; }
          .message-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .message-text { color: #333; font-size: 15px; line-height: 1.7; white-space: pre-wrap; }
          .footer { background: #f8f9fa; padding: 16px 30px; text-align: center; border-top: 1px solid #eee; }
          .badge { display: inline-block; background: #7AA228; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <span class="logo-icon">&lt;/&gt;</span>
              <div class="header-text">
                <h1>Nuevo Contacto</h1>
                <p>FORMULARIO WEB</p>
              </div>
            </div>
            <div class="content">
              <div class="contact-card">
                <h2 class="contact-name">${data.nombre}</h2>
                ${data.empresa ? `<p class="contact-company">${data.empresa}</p>` : ''}
                
                <div class="contact-info">
                  <div class="contact-row">
                    <span class="contact-icon">📧</span>
                    <a href="mailto:${data.email}" class="contact-link">${data.email}</a>
                  </div>
                  ${data.telefono ? `
                  <div class="contact-row">
                    <span class="contact-icon">📱</span>
                    <a href="tel:${data.telefono}" class="contact-link">${data.telefono}</a>
                  </div>
                  ` : ''}
                </div>
                
                <div class="divider"></div>
                
                <div class="message-label">Mensaje</div>
                <div class="message-text">${data.mensaje}</div>
              </div>
            </div>
            <div class="footer">
              <span class="badge">itsdev.cl</span>
            </div>
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f0f0f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: #224859; padding: 28px 30px; text-align: center; }
          .logo-text { color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -1px; }
          .logo-text span { color: #7AA228; }
          .tagline { color: rgba(255,255,255,0.7); font-size: 11px; letter-spacing: 2px; margin: 4px 0 0; }
          .title-bar { background: #7AA228; padding: 16px 30px; text-align: center; }
          .title-bar h1 { color: white; margin: 0; font-size: 18px; font-weight: 600; }
          .content { padding: 28px 30px; }
          .message { margin: 0; }
          .message p { margin: 0 0 14px; color: #444; font-size: 15px; }
          .message p:last-child { margin: 0; }
          .cta { text-align: center; margin: 24px 0 8px; }
          .cta a { display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px; }
          .footer { background: #224859; padding: 18px 30px; text-align: center; color: rgba(255,255,255,0.8); font-size: 12px; }
          .footer p { margin: 0; }
          .footer a { color: #7AA228; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <p class="logo-text">ITS<span>-Dev</span></p>
              <p class="tagline">SOLUCIONES TECNOLÓGICAS</p>
            </div>
            <div class="title-bar">
              <h1>¡Gracias por contactarnos!</h1>
            </div>
            <div class="content">
              <div class="message">
                <p>Hola <strong>${data.nombre}</strong>,</p>
                <p>Gracias por tu interés en ItsDev. Hemos recibido tu mensaje y nos pondremos en contacto contigo en las próximas <strong>24 horas hábiles</strong>.</p>
                <p>Si tu consulta es urgente, puedes contactarnos directamente por WhatsApp:</p>
              </div>
              <div class="cta">
                <a href="https://wa.me/56990958220?text=Hola%2C%20acabo%20de%20enviar%20un%20formulario%20desde%20itsdev.cl">💬 Escribir por WhatsApp</a>
              </div>
            </div>
            <div class="footer">
              <p><strong>ItsDev</strong> - Soluciones Tecnológicas que Funcionan</p>
              <p style="margin-top:6px;">📧 <a href="mailto:contacto@itsdev.cl">contacto@itsdev.cl</a> · 📱 <a href="tel:+56990958220">+56 9 9095 8220</a></p>
            </div>
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
