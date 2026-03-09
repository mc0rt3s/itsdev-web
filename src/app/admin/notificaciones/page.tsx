'use client';

import { useEffect, useMemo, useState } from 'react';

interface NotificacionCotizacion {
    id: string;
    createdAt: string;
    cotizacionId: string | null;
    cotizacionNumero: string | null;
    estadoAnterior: string | null;
    estadoNuevo: string | null;
    canal: string;
    actorId: string | null;
}

const READ_KEY = 'cotizaciones_notifications_read_at';

const CANAL_LABEL: Record<string, string> = {
    cliente_link: 'Cliente (link)',
    panel_admin: 'Panel admin',
    sistema: 'Sistema',
    desconocido: 'Desconocido'
};

export default function NotificacionesPage() {
    const [items, setItems] = useState<NotificacionCotizacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [readAt, setReadAt] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/cotizaciones/notificaciones?limit=100', { cache: 'no-store' });
            if (!res.ok) throw new Error('Error al cargar notificaciones');
            const data = await res.json();
            setItems(data.items || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem(READ_KEY);
            if (stored) setReadAt(stored);
        }

        fetchData();
        const interval = setInterval(fetchData, 30_000);
        return () => clearInterval(interval);
    }, []);

    const total = items.length;
    const aprobadas = useMemo(() => items.filter((item) => item.estadoNuevo === 'aprobada').length, [items]);
    const rechazadas = useMemo(() => items.filter((item) => item.estadoNuevo === 'rechazada').length, [items]);
    const noLeidas = useMemo(() => {
        if (!readAt) return items.length;
        const readDate = new Date(readAt);
        return items.filter((item) => new Date(item.createdAt) > readDate).length;
    }, [items, readAt]);

    const markAllAsRead = () => {
        const now = new Date().toISOString();
        setReadAt(now);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(READ_KEY, now);
            window.dispatchEvent(new Event('cotizaciones-notificaciones-read'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Notificaciones</h1>
                    <p className="text-slate-400 mt-1">Cambios de estado en cotizaciones</p>
                </div>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/40 transition"
                >
                    Actualizar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                    <p className="text-slate-400 text-sm">Total eventos</p>
                    <p className="text-2xl text-white font-semibold">{total}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                    <p className="text-slate-400 text-sm">Aprobadas</p>
                    <p className="text-2xl text-emerald-400 font-semibold">{aprobadas}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                    <p className="text-slate-400 text-sm">Rechazadas</p>
                    <p className="text-2xl text-rose-400 font-semibold">{rechazadas}</p>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/30 p-4">
                <div className="text-sm text-slate-300">
                    No leídas: <span className="font-semibold text-white">{noLeidas}</span>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/40 transition"
                >
                    Marcar todo como leído
                </button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-slate-400">Cargando notificaciones...</div>
                ) : error ? (
                    <div className="p-8 text-rose-300">{error}</div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-slate-400">No hay notificaciones de cotizaciones.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/80 border-b border-slate-700">
                            <tr>
                                <th className="p-3 text-xs uppercase tracking-wide text-slate-400">Fecha</th>
                                <th className="p-3 text-xs uppercase tracking-wide text-slate-400">Cotización</th>
                                <th className="p-3 text-xs uppercase tracking-wide text-slate-400">Cambio</th>
                                <th className="p-3 text-xs uppercase tracking-wide text-slate-400">Canal</th>
                                <th className="p-3 text-xs uppercase tracking-wide text-slate-400">Actor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-slate-700/60 last:border-b-0">
                                    <td className="p-3 text-slate-300 text-sm">
                                        {new Date(item.createdAt).toLocaleString('es-CL')}
                                    </td>
                                    <td className="p-3 text-slate-100 font-medium">
                                        {item.cotizacionNumero || item.cotizacionId || '-'}
                                    </td>
                                    <td className="p-3 text-slate-200">
                                        <span className="text-slate-400">{item.estadoAnterior || '-'}</span>
                                        <span className="mx-2 text-slate-500">→</span>
                                        <span className="font-semibold">{item.estadoNuevo || '-'}</span>
                                    </td>
                                    <td className="p-3 text-slate-300">{CANAL_LABEL[item.canal] || item.canal}</td>
                                    <td className="p-3 text-slate-400 text-sm">{item.actorId || 'cliente'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
