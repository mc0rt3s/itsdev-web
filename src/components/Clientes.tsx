const clientes = [
  {
    nombre: 'Arenys Med',
    logo: '/clientes/arenys-med.png', // Placeholder - necesitarás agregar los logos reales
    sector: 'Salud',
  },
  {
    nombre: 'CyC Isla y Cia',
    logo: '/clientes/cyc-isla.png',
    sector: 'Retail',
  },
  {
    nombre: 'VBrand',
    logo: '/clientes/vbrand.png',
    sector: 'Marketing Digital',
  },
];

export default function Clientes() {
  return (
    <section id="clientes" className="py-24 lg:py-32 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-[#7AA228] font-semibold text-sm tracking-wider uppercase mb-4">
            Confianza
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Empresas que confían en
            <span className="text-[#7AA228]"> nuestras soluciones</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Trabajamos con empresas que valoran la calidad, la confiabilidad y el compromiso real 
            con sus objetivos de negocio.
          </p>
        </div>

        {/* Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12 items-center justify-items-center">
          {clientes.map((cliente, index) => (
            <div
              key={index}
              className="group w-full max-w-[200px] h-24 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-[#7AA228]/50 hover:shadow-lg transition-all duration-300 grayscale hover:grayscale-0 opacity-60 hover:opacity-100"
            >
              {/* Si hay logo, mostrar imagen, sino mostrar texto */}
              <div className="text-center">
                <div className="text-lg font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#7AA228] transition-colors">
                  {cliente.nombre}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {cliente.sector}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Message */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 italic max-w-2xl mx-auto">
            "La confianza se construye con resultados. Cada proyecto exitoso es un testimonio 
            de nuestro compromiso con la excelencia técnica y el servicio al cliente."
          </p>
        </div>
      </div>
    </section>
  );
}
