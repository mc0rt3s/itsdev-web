'use client';

import { useState, useEffect } from 'react';
import Logo from './Logo';

const navLinks = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#metodologia', label: 'Cómo Trabajamos' },
  { href: '#experiencia', label: 'Experiencia' },
  { href: '#nosotros', label: 'Por qué ItsDev' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="group hover:opacity-90 transition-opacity">
            <Logo 
              variant="text"
              size="md"
              inverted={!isScrolled}
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#7AA228] ${
                  isScrolled
                    ? 'text-slate-600 dark:text-slate-300'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              className="bg-[#7AA228] hover:bg-[#6A9020] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#7AA228]/25"
            >
              Conversemos
            </a>
            <a
              href="/login"
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                isScrolled
                  ? 'text-slate-500 hover:text-[#7AA228] hover:bg-slate-100'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Acceso Admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96 pb-6' : 'max-h-0'
          }`}
        >
          <div className={`flex flex-col gap-4 pt-4 border-t ${
            isScrolled ? 'border-slate-200 dark:border-slate-700' : 'border-white/20'
          }`}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors ${
                  isScrolled
                    ? 'text-slate-600 dark:text-slate-300 hover:text-[#7AA228]'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-[#7AA228] hover:bg-[#6A9020] text-white px-5 py-3 rounded-full text-base font-semibold transition-all text-center mt-2"
            >
              Conversemos
            </a>
            <a
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 py-2 transition-colors ${
                isScrolled
                  ? 'text-slate-400 hover:text-[#7AA228]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm">Admin</span>
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
