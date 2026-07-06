'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface PautaCard {
  tipo: string;
  id: string;
  titulo: string;
  subtitulo: string;
  clienteId?: string | null;
  oportunidadId?: string | null;
  fecha?: string | null;
  monto?: number | null;
  urgente: boolean;
  href: string;
  etapa?: string;
  etapaColor?: string;
  tipoActividad?: string;
}

interface PautaData {
  cobrar: PautaCard[];
  seguimiento: PautaCard[];
  renovaciones: PautaCard[];
  hoy: PautaCard[];
}

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const fechaRel = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  const hoy = new Date();
  const diff = Math.round((d.getTime() - hoy.getTime()) / 86400000);
  if (diff < 0) return `hace ${Math.abs(diff)} días`;
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'mañana';
  return `en ${diff} días`;
};

const tipoIcon: Record<string, string> = {
  llamada: '📞', reunion: '🤝', correo: '✉️', whatsapp: '💬', visita: '🚗', nota: '📝',
};

function PautaColumn({
  title, color, cards, emptyMsg, onResolve, onPosponer,
}: {
  title: string;
  color: string;
  cards: PautaCard[];
  emptyMsg: string;
  onResolve: (card: PautaCard) => void;
  onPosponer: (card: PautaCard) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 pb-2 border-b ${color}`}>
        <span className="font-semibold text-white">{title}</span>
        <span className="ml-auto text-xs bg-slate-700/60 text-slate-400 rounded-full px-2 py-0.5">{cards.length}</span>
      </div>
      {cards.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-6">{emptyMsg}</p>
      )}
      {cards.map(card => (
        <div
          key={card.id}
          className={`bg-slate-800/50 border rounded-xl p-4 space-y-2 transition-all hover:border-slate-600/70 ${
            card.urgente ? 'border-rose-500/40' : 'border-slate-700/50'
          }`}
        >
          {card.urgente && (
            <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2 py-0.5">
              Urgente
            </span>
          )}
          <div>
            <p className="font-medium text-white text-sm leading-snug">
              {card.tipoActividad && <span className="mr-1">{tipoIcon[card.tipoActividad] || '📌'}</span>}
              {card.titulo}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">{card.subtitulo}</p>
          </div>
          {card.etapa && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full border"
              style={{ color: card.etapaColor, borderColor: card.etapaColor + '50', background: card.etapaColor + '20' }}>
              {card.etapa}
            </span>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {card.fecha && (
              <span className="text-xs text-slate-500">{fechaRel(card.fecha)}</span>
            )}
            {card.monto != null && (
              <span className="text-xs font-semibold text-emerald-400">{CLP(card.monto)}</span>
            )}
          </div>
          <div className="flex gap-1 pt-1">
            <button
              onClick={() => onResolve(card)}
              className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-medium"
            >
              Resolver
            </button>
            <button
              onClick={() => onPosponer(card)}
              className="flex-1 text-xs py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700/70 text-slate-400 border border-slate-700/50 transition-all font-medium"
            >
              Posponer
            </button>
            <Link
              href={card.href}
              className="flex-1 text-center text-xs py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all font-medium"
            >
              Abrir
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PautaPage() {
  const [data, setData] = useState<PautaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [posponerModal, setPosponerModal] = useState<{ card: PautaCard; fecha: string } | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchPauta = useCallback(async () => {
    try {
      const res = await fetch('/api/pauta');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPauta(); }, [fetchPauta]);

  const filterDismissed = (cards: PautaCard[]) => cards.filter(c => !dismissed.has(c.id));

  const handleResolve = async (card: PautaCard) => {
    if (card.tipo === 'actividad') {
      await fetch(`/api/actividades/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
    }
    setDismissed(prev => new Set(prev).add(card.id));
    fetchPauta();
  };

  const handlePosponer = (card: PautaCard) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPosponerModal({ card, fecha: tomorrow.toISOString().split('T')[0] });
  };

  const confirmPosponer = async () => {
    if (!posponerModal) return;
    const { card, fecha } = posponerModal;
    const iso = new Date(fecha + 'T12:00:00').toISOString();

    if (card.tipo === 'factura') {
      await fetch(`/api/facturas/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaVenc: iso }),
      });
    } else if (card.tipo === 'suscripcion') {
      await fetch(`/api/suscripciones/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxCobro: iso }),
      });
    } else if (card.tipo === 'actividad') {
      await fetch(`/api/actividades/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: iso }),
      });
    }

    setDismissed(prev => new Set(prev).add(card.id));
    setPosponerModal(null);
    fetchPauta();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 text-lg">Cargando pauta...</div>
      </div>
    );
  }

  const hoy = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pauta del día</h1>
          <p className="text-slate-400 mt-1">
            {diasSemana[hoy.getDay()]} {hoy.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchPauta}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <PautaColumn
          title="Cobrar"
          color="border-rose-500/40 text-rose-400"
          cards={filterDismissed(data?.cobrar ?? [])}
          emptyMsg="Sin facturas pendientes"
          onResolve={handleResolve}
          onPosponer={handlePosponer}
        />
        <PautaColumn
          title="Seguimiento"
          color="border-amber-500/40 text-amber-400"
          cards={filterDismissed(data?.seguimiento ?? [])}
          emptyMsg="Sin seguimientos pendientes"
          onResolve={handleResolve}
          onPosponer={handlePosponer}
        />
        <PautaColumn
          title="Renovaciones"
          color="border-violet-500/40 text-violet-400"
          cards={filterDismissed(data?.renovaciones ?? [])}
          emptyMsg="Sin renovaciones próximas"
          onResolve={handleResolve}
          onPosponer={handlePosponer}
        />
        <PautaColumn
          title="Hoy"
          color="border-cyan-500/40 text-cyan-400"
          cards={filterDismissed(data?.hoy ?? [])}
          emptyMsg="Sin actividades para hoy"
          onResolve={handleResolve}
          onPosponer={handlePosponer}
        />
      </div>

      {/* Resumen */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Por cobrar', count: data.cobrar.length, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { label: 'En seguimiento', count: data.seguimiento.length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Renovaciones', count: data.renovaciones.length, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Actividades hoy', count: data.hoy.length, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-700/30`}>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/oportunidades" className="text-sm px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-700/50 rounded-xl transition-all">
          Ver pipeline →
        </Link>
        <Link href="/admin/finanzas/facturas" className="text-sm px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-700/50 rounded-xl transition-all">
          Ver facturas →
        </Link>
        <Link href="/admin/finanzas" className="text-sm px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-700/50 rounded-xl transition-all">
          Dashboard finanzas →
        </Link>
      </div>

      {/* Posponer Modal */}
      {posponerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-white">Posponer</h3>
            <p className="text-slate-400 text-sm">{posponerModal.card.titulo}</p>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nueva fecha</label>
              <input
                type="date"
                value={posponerModal.fecha}
                onChange={e => setPosponerModal(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPosponerModal(null)}
                className="flex-1 py-2 text-sm text-slate-400 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPosponer}
                className="flex-1 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
