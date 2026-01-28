const servicios = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'Desarrollo de Software a Medida',
    description: 'Aplicaciones empresariales diseñadas desde cero para tu realidad operativa. Código limpio, arquitectura sólida y documentación completa que facilita el mantenimiento futuro.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Desarrollo Web',
    description: 'Plataformas web de alto rendimiento que convierten visitantes en clientes. Diseño responsivo, SEO optimizado y arquitectura preparada para escalar según tu crecimiento.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    title: 'Administración de Servidores',
    description: 'Infraestructura cloud y on-premise gestionada con rigor profesional. Monitoreo proactivo, backups automatizados y respuestas inmediatas ante cualquier incidencia.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Soporte TI y Mantenimiento',
    description: 'Equipo técnico disponible cuando lo necesitas. Resolución de incidencias, actualizaciones preventivas y optimización continua para mantener tus sistemas al máximo rendimiento.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Integraciones y Automatización',
    description: 'Conectamos ecosistemas tecnológicos heterogéneos y eliminamos tareas manuales repetitivas. Tu equipo recupera tiempo para actividades de mayor valor estratégico.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Consultoría Tecnológica',
    description: 'Análisis estratégico, roadmaps tecnológicos y recomendaciones basadas en experiencia real. Decisiones informadas que alinean tecnología con objetivos de negocio.',
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <span className="inline-block text-[#7AA228] font-semibold text-sm tracking-wider uppercase mb-4">
            Servicios
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Tecnología que potencia tu
            <span className="text-[#7AA228]"> operación diaria</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Un ecosistema completo de servicios diseñados para empresas que no pueden permitirse 
            interrupciones. Desde la concepción hasta la evolución continua.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicios.map((servicio, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 dark:border-slate-700"
            >
              <div className="w-14 h-14 bg-[#7AA228]/10 rounded-xl flex items-center justify-center text-[#7AA228] mb-6 group-hover:bg-[#7AA228] group-hover:text-white transition-all duration-300">
                {servicio.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {servicio.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {servicio.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Cada empresa tiene necesidades únicas. Si tu desafío no está listado aquí, conversemos.
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 text-[#7AA228] hover:text-[#558B2F] font-semibold transition-colors"
          >
            Hablemos de tu proyecto específico
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
