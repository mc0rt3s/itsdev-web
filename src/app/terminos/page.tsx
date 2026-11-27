import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos de Servicio | ItsDev',
  description: 'Condiciones de uso del sitio itsdev.cl.',
};

export default function TerminosPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-slate-800 dark:text-slate-200">
      <Link href="/" className="text-sm text-[#7AA228] hover:underline">← Volver al inicio</Link>
      <h1 className="text-3xl font-bold mt-6 mb-2">Términos de Servicio</h1>
      <p className="text-sm text-slate-500 mb-10">Última actualización: 27 de noviembre de 2026</p>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">1. Uso del sitio</h2>
        <p>
          Este sitio es informativo y sirve para conocer los servicios de ItsDev y contactarnos. Puedes usarlo
          para fines lícitos y de buena fe.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">2. Contenido</h2>
        <p>
          Los textos, marcas y gráficas del sitio son de ItsDev o se usan con autorización. No puedes copiarlos
          con fines comerciales sin permiso escrito.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">3. Información y servicios</h2>
        <p>
          La información del sitio es referencial. Los alcances, plazos y precios de cada proyecto se acuerdan por
          escrito en una propuesta o contrato específico.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">4. Datos personales</h2>
        <p>
          El tratamiento de los datos que nos entregas a través del formulario de contacto se rige por nuestra{' '}
          <Link href="/privacidad" className="text-[#7AA228] underline">Política de Privacidad</Link>.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">5. Responsabilidad</h2>
        <p>
          ItsDev hace sus mejores esfuerzos para mantener la información actualizada, pero no garantiza que el sitio
          esté libre de errores o interrupciones.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">6. Contacto</h2>
        <p>
          Para consultas sobre estos términos escribe a{' '}
          <a className="text-[#7AA228] underline" href="mailto:contacto@itsdev.cl">contacto@itsdev.cl</a>.
        </p>
      </section>
    </main>
  );
}
