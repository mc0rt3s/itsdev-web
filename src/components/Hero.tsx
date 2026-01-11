import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#7AA228]/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#7AA228]/10 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo grande - versión para fondo oscuro */}
          <div className="mb-8 animate-fade-in flex justify-center">
            <Image
              src="/logo-dark.svg"
              alt="ItsDev - Soluciones Informáticas"
              width={320}
              height={256}
              priority
              className="w-auto h-40 sm:h-48 lg:h-56"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in-up">
            Soluciones tecnológicas
            <span className="block text-[#7AA228]">que simplemente funcionan</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
            Desarrollo de software, infraestructura TI y automatización para empresas 
            que buscan estabilidad, continuidad operativa y crecimiento tecnológico.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <a
              href="#contacto"
              className="w-full sm:w-auto bg-[#7AA228] hover:bg-[#6A9020] text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-[#7AA228]/30 hover:scale-105"
            >
              Conversemos sobre tu proyecto
            </a>
            <a
              href="#servicios"
              className="w-full sm:w-auto border border-white/30 hover:border-white/50 text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:bg-white/5"
            >
              Ver servicios
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-16 border-t border-white/10 animate-fade-in-up animation-delay-400">
            <p className="text-sm text-slate-400 mb-6">Empresas que confían en nosotros</p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
              {/* Logos de clientes */}
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                <span className="text-white font-semibold tracking-wide">Arenys Med</span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                <span className="text-white font-semibold tracking-wide">CyC Isla y Cia</span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                <span className="text-white font-semibold tracking-wide">VBrand</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#servicios" className="text-white/50 hover:text-white/80 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
}
