const diferenciales = [
  {
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    titulo: 'Cercanía real',
    descripcion: 'No somos una multinacional donde eres un número. Aquí hablas directo con quienes hacen el trabajo.',
  },
  {
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    titulo: 'Responsabilidad',
    descripcion: 'Si algo falla, lo solucionamos. Sin excusas, sin echar culpas. Nos hacemos cargo.',
  },
  {
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    titulo: 'Visión de largo plazo',
    descripcion: 'No buscamos proyectos puntuales. Queremos crecer contigo y ser tu partner tecnológico por años.',
  },
  {
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    titulo: 'Respuesta rápida',
    descripcion: 'Entendemos que tu negocio no puede esperar. Tiempos de respuesta acordes a la urgencia real.',
  },
  {
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    titulo: 'Transparencia total',
    descripcion: 'Presupuestos claros, avances visibles, documentación completa. Sin sorpresas ni costos ocultos.',
  },
  {
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    titulo: 'Conocimiento profundo',
    descripcion: 'Años de experiencia en múltiples tecnologías. Sabemos qué funciona y qué no.',
  },
];

export default function PorQueItsDev() {
  return (
    <section id="nosotros" className="py-24 lg:py-32 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-[#7AA228] font-semibold text-sm tracking-wider uppercase mb-4">
            Diferencial
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            ¿Por qué elegir
            <span className="text-[#7AA228]"> ItsDev</span>?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            No somos la opción más barata, ni la más grande. Somos la opción que 
            realmente se preocupa de que tu tecnología funcione.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {diferenciales.map((item, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-[#7AA228]/50 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#7AA228]/10 rounded-xl flex items-center justify-center text-[#7AA228] group-hover:bg-[#7AA228] group-hover:text-white transition-all duration-300">
                  {item.icono}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {item.descripcion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Box */}
        <div className="mt-16 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 rounded-3xl p-8 lg:p-12 text-center">
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            ¿Listo para tener tecnología que simplemente funcione?
          </h3>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Conversemos sobre tus desafíos actuales. Sin compromiso, sin presión de venta. 
            Solo una conversación técnica para entender cómo podemos ayudarte.
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-[#7AA228] hover:bg-[#6A9020] text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-[#7AA228]/30"
          >
            Agenda una conversación
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
