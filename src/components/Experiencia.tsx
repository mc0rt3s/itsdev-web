const stats = [
  {
    valor: '+10',
    label: 'Años de experiencia',
    descripcion: 'en el mercado TI chileno',
  },
  {
    valor: '+50',
    label: 'Proyectos entregados',
    descripcion: 'exitosamente implementados',
  },
  {
    valor: '99.9%',
    label: 'Uptime garantizado',
    descripcion: 'en infraestructura gestionada',
  },
  {
    valor: '24/7',
    label: 'Soporte disponible',
    descripcion: 'para clientes con contrato',
  },
];

const sectores = [
  'Retail y Comercio',
  'Servicios Financieros',
  'Logística y Transporte',
  'Salud',
  'Educación',
  'Manufactura',
];

export default function Experiencia() {
  return (
    <section id="experiencia" className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-[#7AA228] font-semibold text-sm tracking-wider uppercase mb-4">
            Trayectoria
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Experiencia que
            <span className="text-[#7AA228]"> genera confianza</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Una trayectoria construida con resultados concretos. Cada proyecto suma experiencia, 
            cada desafío resuelto fortalece nuestra capacidad de entregar soluciones que realmente funcionan.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl lg:text-5xl font-bold text-[#7AA228] mb-2">
                {stat.valor}
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {stat.descripcion}
              </div>
            </div>
          ))}
        </div>

        {/* Sectors */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Sectores donde hemos dejado huella
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                La experiencia en múltiples sectores nos permite entender el contexto operativo de cada cliente. 
                No solo implementamos tecnología, diseñamos soluciones que respetan la realidad de tu industria.
              </p>
              <div className="flex flex-wrap gap-3">
                {sectores.map((sector, index) => (
                  <span
                    key={index}
                    className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#7AA228]/20 to-[#558B2F]/20 rounded-2xl p-8 border border-[#7AA228]/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#7AA228] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 italic mb-4">
                      "Llevamos 5 años trabajando con ItsDev. Son más que un proveedor, 
                      son parte de nuestro equipo. Siempre responden, siempre cumplen."
                    </p>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Gerente de Operaciones
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Empresa de Logística - Región Metropolitana
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
