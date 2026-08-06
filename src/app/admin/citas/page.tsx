'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || 'https://citas.itsdev.cl';

export default function CitasPage() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BOOKING_URL);
      setCopied(true);
      toast.success('URL de reserva copiada');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar la URL');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Citas</h1>
        <p className="text-slate-400 mt-1">
          Agenda de reuniones y reservas para tus clientes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Reservar */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-2">
            Agendar una cita
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            Comparte tu página de reservas con los clientes. Ellos eligen el
            horario y reciben la confirmación automáticamente.
          </p>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#7AA228] hover:bg-[#6A9020] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Abrir página de reservas
          </a>
        </div>

        {/* URL */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-2">
            URL de reserva
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Esta es la página pública donde tus clientes pueden agendar.
          </p>
          <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
            <span className="text-slate-200 text-sm flex-1 truncate">
              {BOOKING_URL}
            </span>
            <button
              onClick={copy}
              className="text-[#7AA228] hover:text-[#6A9020] text-sm font-semibold"
            >
              {copied ? '¡Copiada!' : 'Copiar'}
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-4">
            Configura la URL en la variable{' '}
            <code className="text-slate-300">NEXT_PUBLIC_BOOKING_URL</code> si
            cambia.
          </p>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-3">
          Cómo configurar el agendador
        </h2>
        <ol className="list-decimal list-inside text-slate-300 text-sm space-y-2">
          <li>
            Entra a{' '}
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7AA228] hover:underline"
            >
              {BOOKING_URL}
            </a>{' '}
            con la cuenta de administrador.
          </li>
          <li>Configura tu disponibilidad y los tipos de evento (duración, horarios).</li>
          <li>
            Comparte la URL a tus clientes, o úsala junto con este módulo.
          </li>
        </ol>
      </div>
    </div>
  );
}
