'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

export const CONSENT_KEY = 'itsdev-cookie-consent';

export default function CookieBanner() {
  const subscribe = (cb: () => void) => {
    window.addEventListener('itsdev-consent', cb);
    return () => window.removeEventListener('itsdev-consent', cb);
  };
  const decided = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(CONSENT_KEY) !== null,
    () => true, // SSR: no mostrar hasta saber la decisión
  );

  const decide = (value: 'accepted' | 'rejected') => {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent('itsdev-consent', { detail: value }));
  };

  if (decided) return null;

  return (
    <div role="dialog" aria-label="Aviso de cookies" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-md z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-5">
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Usamos cookies de medición (Google Tag Manager) para entender cómo se usa el sitio. Puedes aceptarlas o rechazarlas. Más en nuestra{' '}
        <Link href="/privacidad" className="text-[#7AA228] underline">Política de Privacidad</Link>.
      </p>
      <div className="flex gap-3 mt-4">
        <button onClick={() => decide('rejected')} className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
          Rechazar
        </button>
        <button onClick={() => decide('accepted')} className="flex-1 py-2 rounded-xl bg-[#7AA228] hover:bg-[#6A9020] text-white text-sm font-semibold">
          Aceptar
        </button>
      </div>
    </div>
  );
}
