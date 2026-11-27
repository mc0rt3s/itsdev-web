import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | ItsDev',
  description: 'Cómo ItsDev trata los datos personales y las cookies del sitio itsdev.cl.',
};

export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-slate-800 dark:text-slate-200">
      <Link href="/" className="text-sm text-[#7AA228] hover:underline">← Volver al inicio</Link>
      <h1 className="text-3xl font-bold mt-6 mb-2">Política de Privacidad</h1>
      <p className="text-sm text-slate-500 mb-10">Última actualización: 27 de noviembre de 2026</p>

      <p className="mb-8">
        Esta política se elabora conforme a la Ley 19.628 sobre protección de la vida privada y a la Ley 21.719
        sobre protección de datos personales.
      </p>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">1. Responsable del tratamiento</h2>
        <p>
          El responsable de los datos personales recogidos a través de este sitio es ItsDev, Chile.
          Puedes escribirnos a <a className="text-[#7AA228] underline" href="mailto:contacto@itsdev.cl">contacto@itsdev.cl</a> o
          al +56 9 9095 8220 para cualquier asunto relacionado con tus datos.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">2. Qué datos recogemos y para qué</h2>
        <p>
          Este sitio no exige registro ni crea cuentas de usuario. Solo tratamos los datos que tú decides entregarnos
          a través del formulario de contacto: nombre, empresa (opcional), correo electrónico, teléfono (opcional) y el
          mensaje que escribes.
        </p>
        <p>
          La finalidad es responder tu consulta y, si la solicitas, preparar una propuesta de servicios.
        </p>
        <p>
          La base de licitud es tu consentimiento, que otorgas al marcar la casilla de aceptación y enviar el formulario.
          Puedes revocarlo en cualquier momento escribiéndonos.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">3. Conservación</h2>
        <p>
          Conservamos tus datos mientras dure la conversación comercial y por el tiempo necesario para cumplir
          obligaciones legales. Después los eliminamos.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">4. Cookies y herramientas de medición</h2>
        <p>
          Al entrar al sitio te mostramos un aviso para elegir si aceptas cookies de medición. Si no las aceptas,
          no se cargan y la navegación no se ve afectada. Guardamos tu decisión en tu navegador para no volver a
          preguntártela.
        </p>
        <p>
          Hoy el sitio carga Google Tag Manager, solo si aceptas. Si en el futuro activamos herramientas adicionales
          (por ejemplo, analítica o publicidad), las detallaremos en esta sección antes de activarlas.
        </p>
        <p>
          Puedes cambiar tu decisión en cualquier momento desde «Preferencias de cookies», al pie de la página.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">5. Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición y portabilidad de tus datos,
          además de revocar el consentimiento otorgado. Para hacerlo escríbenos a{' '}
          <a className="text-[#7AA228] underline" href="mailto:contacto@itsdev.cl">contacto@itsdev.cl</a> indicando
          el derecho que quieres ejercer y un medio para responderte.
        </p>
        <p>
          Si consideras que no atendimos tu solicitud correctamente, puedes reclamar ante la Agencia de Protección de
          Datos Personales, una vez que esté en funcionamiento.
        </p>
      </section>
    </main>
  );
}
