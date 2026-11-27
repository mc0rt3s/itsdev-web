import Link from 'next/link';
import Logo from './Logo';

const navLinks = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#metodologia', label: 'Cómo Trabajamos' },
  { href: '#experiencia', label: 'Experiencia' },
  { href: '#nosotros', label: 'Por qué ItsDev' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 dark:bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-2 hover:opacity-90 transition-opacity">
              <Logo variant="full" size="md" />
            </Link>
            <p className="text-xs text-slate-500 mb-6">IT Specialists & Development Solutions</p>
            <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
              Soluciones tecnológicas robustas, seguras y escalables para empresas 
              que necesitan que su infraestructura y software simplemente funcionen.
            </p>
            <p className="text-sm text-slate-500">
              Servicios Informáticos Marcelo Cortés EIRL
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Navegación
            </h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-slate-300 hover:text-[#7AA228] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contacto@itsdev.cl"
                  className="text-slate-300 hover:text-[#7AA228] transition-colors"
                >
                  contacto@itsdev.cl
                </a>
              </li>
              <li>
                <a
                  href="tel:+56990958220"
                  className="text-slate-300 hover:text-[#7AA228] transition-colors"
                >
                  +56 9 9095 8220
                </a>
              </li>
              <li className="text-slate-400 text-sm">
                Casablanca, Valparaíso, Chile
              </li>
            </ul>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} ItsDev. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacidad" className="text-slate-500 hover:text-slate-300 transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/terminos" className="text-slate-500 hover:text-slate-300 transition-colors">
              Términos de Servicio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
