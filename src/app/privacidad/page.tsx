import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | ItsDev',
  description: 'Cómo ItsDev trata los datos personales y cookies del sitio itsdev.cl.',
};

export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-slate-800 dark:text-slate-200">
      <Link href="/" className="text-sm text-[#7AA228] hover:underline">← Volver al inicio</Link>
      <h1 className="text-3xl font-bold mt-6 mb-2">Política de Privacidad</h1>
      <p className="text-sm text-slate-500 mb-10">Última actualización: 27 de noviembre de 2026</p>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">1. Responsable</h2>
        <p>ItsDev, Chile. Contacto: <a className="text-[#7AA228] underline" href="mailto:contacto@itsdev.cl">contacto@itsdev.cl</a>.</p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">2. Datos que tratamos</h2>
        <p>Si nos escribes por el formulario de contacto: nombre, empresa (opcional), email, teléfono (opcional) y el mensaje. Si aceptas cookies de medición: datos de navegación anónimos enviados a Google Tag Manager.</p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">3. Finalidad y base legal</h2>
        <p>Usamos tus datos solo para responder tu consulta y, si lo pides, enviarte información sobre nuestros servicios. La base es tu consentimiento, que otorgas al marcar la casilla del formulario.</p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">4. Cookies</h2>
        <p>Usamos cookies técnicas necesarias para el funcionamiento del sitio. Las cookies de medición (Google Tag Manager) solo se cargan si las aceptas en el aviso de cookies. Puedes cambiar tu decisión borrando los datos del sitio en tu navegador.</p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">5. Conservación</h2>
        <p>Conservamos las consultas recibidas solo el tiempo necesario para atenderlas y cumplir obligaciones legales.</p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">6. Tus derechos</h2>
        <p>Puedes solicitar acceso, rectificación, supresión u oposición al tratamiento de tus datos escribiendo a <a className="text-[#7AA228] underline" href="mailto:contacto@itsdev.cl">contacto@itsdev.cl</a>. Esto se rige por la Ley 19.628 sobre protección de la vida privada y, desde su entrada en vigencia, por la Ley 21.719 sobre protección de datos personales.</p>
      </section>
    </main>
  );
}
