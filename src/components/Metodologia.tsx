const pasos = [
  {
    numero: '01',
    titulo: 'Diagnóstico',
    descripcion: 'Auditoría técnica profunda de tu infraestructura y procesos. Identificamos cuellos de botella, riesgos operativos y oportunidades de optimización con impacto real en tu negocio.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    numero: '02',
    titulo: 'Propuesta',
    descripcion: 'Documento técnico detallado con arquitectura propuesta, cronograma realista, hitos de entrega y desglose de inversión. Sin ambigüedades, sin costos ocultos.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    numero: '03',
    titulo: 'Implementación',
    descripcion: 'Desarrollo iterativo con entregas funcionales cada 2-3 semanas. Revisión continua, ajustes oportunos y transparencia total sobre el avance del proyecto.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    numero: '04',
    titulo: 'Soporte y Mejora Continua',
    descripcion: 'Relación de largo plazo. Monitoreo activo, mejoras incrementales y evolución del sistema según nuevas necesidades. Tu tecnología crece contigo.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

export default function Metodologia() {
  return (
    <section id="metodologia" className="py-24 lg:py-32 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-block text-[#7AA228] font-semibold text-sm tracking-wider uppercase mb-4">
              Metodología
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Cómo <span className="text-[#7AA228]">trabajamos</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Metodología probada que garantiza entregas a tiempo, dentro del presupuesto y con la calidad esperada. 
              Comunicación constante, transparencia total y resultados medibles en cada etapa.
            </p>

            {/* Process Steps */}
            <div className="space-y-6">
              {pasos.map((paso, index) => (
                <div
                  key={index}
                  className="group flex gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#7AA228]/10 rounded-xl flex items-center justify-center text-[#7AA228] group-hover:bg-[#7AA228] group-hover:text-white transition-all">
                    {paso.icono}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-[#7AA228]">{paso.numero}</span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {paso.titulo}
                      </h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {paso.descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-3xl overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Central circle */}
                  <div className="w-32 h-32 bg-[#7AA228] rounded-full flex items-center justify-center shadow-xl shadow-[#7AA228]/30">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  
                  {/* Orbiting elements */}
                  <div className="absolute -top-8 -right-8 w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#7AA228]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  <div className="absolute -bottom-6 -left-6 w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#7AA228]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  
                  <div className="absolute top-4 -left-12 w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#7AA228]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
