'use client';

import { useState } from 'react';

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    mensaje: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío - aquí iría la lógica real de envío
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <section id="contacto" className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <span className="inline-block text-[#7AA228] font-semibold text-sm tracking-wider uppercase mb-4">
              Contacto
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              <span className="text-[#7AA228]">Conversemos</span> sobre
              <br />tu proyecto
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
              Cuéntanos qué necesitas. Sin compromiso, sin presión. 
              Solo una conversación para entender cómo podemos ayudarte.
            </p>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#7AA228]/10 rounded-xl flex items-center justify-center text-[#7AA228]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Email</div>
                  <a href="mailto:contacto@itsdev.cl" className="text-slate-600 dark:text-slate-400 hover:text-[#7AA228] transition-colors">
                    contacto@itsdev.cl
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#7AA228]/10 rounded-xl flex items-center justify-center text-[#7AA228]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Teléfono</div>
                  <a href="tel:+56975362904" className="text-slate-600 dark:text-slate-400 hover:text-[#7AA228] transition-colors">
                    +56 9 7536 2904
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">WhatsApp</div>
                  <a 
                    href="https://wa.me/56975362904?text=Hola%2C%20me%20interesa%20conocer%20más%20sobre%20sus%20servicios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-[#25D366] transition-colors"
                  >
                    Escríbenos directo
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#7AA228]/10 rounded-xl flex items-center justify-center text-[#7AA228]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Horario de atención</div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Lunes a Viernes, 9:00 - 18:00 hrs
                  </div>
                </div>
              </div>
            </div>

            {/* Response time */}
            <div className="mt-10 p-4 bg-[#7AA228]/10 rounded-xl border border-[#7AA228]/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#7AA228]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Respuesta rápida:</strong> Nos comunicamos contigo en menos de 24 horas hábiles.
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-10 shadow-xl border border-slate-100 dark:border-slate-700">
            {isSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-[#7AA228] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  ¡Mensaje recibido!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Gracias por contactarnos. Te responderemos pronto.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '' });
                  }}
                  className="text-[#7AA228] hover:text-[#6A9020] font-medium transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AA228] focus:border-transparent transition-all"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AA228] focus:border-transparent transition-all"
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AA228] focus:border-transparent transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AA228] focus:border-transparent transition-all"
                      placeholder="+56 9 7536 2904"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ¿En qué podemos ayudarte? *
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    required
                    rows={4}
                    value={formData.mensaje}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AA228] focus:border-transparent transition-all resize-none"
                    placeholder="Cuéntanos sobre tu proyecto o necesidad..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#7AA228] hover:bg-[#6A9020] disabled:bg-slate-400 text-white py-4 rounded-xl text-lg font-semibold transition-all hover:shadow-lg hover:shadow-[#7AA228]/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar mensaje'
                  )}
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Al enviar este formulario aceptas nuestra política de privacidad.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
