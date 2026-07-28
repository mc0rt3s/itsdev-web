'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  probability: number;
}

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  proyecto:  { label: 'Proyecto',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  licencia:  { label: 'Licencia',  color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  equipo:    { label: 'Equipo',    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  soporte:   { label: 'Soporte',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

interface Oportunidad {
  id: string;
  titulo: string;
  tipo: string;
  monto: number | null;
  moneda: string;
  stageId: string;
  stage: Stage;
  cliente: { id: string; razonSocial: string };
  cotizacion: { id: string; numero: string; estado: string } | null;
  actividades: Array<{ id: string; nextActionDate: string | null; tipo: string; asunto: string }>;
  _count: { actividades: number };
  updatedAt: string;
  expectedCloseDate: string | null;
}

interface NewOportunidad {
  clienteId: string;
  stageId: string;
  titulo: string;
  tipo: string;
  monto: string;
  moneda: string;
  expectedCloseDate: string;
  source: string;
}

interface Actividad {
  id: string;
  tipo: string;
  asunto: string;
  notas: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  nextActionDate: string | null;
  createdAt: string;
}

interface Cliente { id: string; razonSocial: string }

const CLP = (n: number, moneda = 'CLP') => {
  if (moneda === 'UF') return `${n.toLocaleString('es-CL', { maximumFractionDigits: 2 })} UF`;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
};

export default function OportunidadesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [lostModal, setLostModal] = useState<{ id: string; stageId: string } | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [newModal, setNewModal] = useState<{ stageId: string } | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<NewOportunidad>({ clienteId: '', stageId: '', titulo: '', tipo: 'proyecto', monto: '', moneda: 'CLP', expectedCloseDate: '', source: '' });
  const [actModal, setActModal] = useState<Oportunidad | null>(null);
  const [actForm, setActForm] = useState({ tipo: 'llamada', asunto: '', notas: '', scheduledAt: '', nextActionDate: '' });
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingActs, setLoadingActs] = useState(false);
  const [showActForm, setShowActForm] = useState(false);

  const fetchAll = useCallback(async () => {
    const [stRes, opRes] = await Promise.all([
      fetch('/api/pipeline/stages'),
      fetch('/api/oportunidades'),
    ]);
    if (stRes.ok) setStages(await stRes.json());
    if (opRes.ok) setOportunidades(await opRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (newModal) {
      fetch('/api/clientes').then(r => r.json()).then(d => setClientes(Array.isArray(d) ? d : []));
      setForm(prev => ({ ...prev, stageId: newModal.stageId }));
    }
  }, [newModal]);

  const handleDrop = async (targetStageId: string) => {
    if (!dragId || dragId === targetStageId) return;
    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    if (targetStage.isLost) {
      setLostModal({ id: dragId, stageId: targetStageId });
      setLostReason('');
      setDragId(null);
      setDropTarget(null);
      return;
    }

    await moveOportunidad(dragId, targetStageId);
    setDragId(null);
    setDropTarget(null);
  };

  const moveOportunidad = async (id: string, stageId: string, lostReasonVal?: string) => {
    const res = await fetch(`/api/oportunidades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId, ...(lostReasonVal ? { lostReason: lostReasonVal } : {}) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOportunidades(prev => prev.map(op => op.id === id ? { ...op, ...updated } : op));
    }
  };

  const confirmLost = async () => {
    if (!lostModal || !lostReason.trim()) return;
    await moveOportunidad(lostModal.id, lostModal.stageId, lostReason);
    setLostModal(null);
    setLostReason('');
  };

  const createOportunidad = async () => {
    if (!form.clienteId || !form.titulo || !form.stageId) return;
    const res = await fetch('/api/oportunidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        tipo: form.tipo || 'proyecto',
        monto: form.monto ? Number(form.monto) : null,
        expectedCloseDate: form.expectedCloseDate || null,
        source: form.source || null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setOportunidades(prev => [...prev, created]);
      setNewModal(null);
    }
  };

  const openActModal = async (op: Oportunidad, openForm = false) => {
    setActModal(op);
    setShowActForm(openForm);
    setActividades([]);
    setLoadingActs(true);
    try {
      const res = await fetch(`/api/oportunidades/${op.id}/actividades`);
      if (res.ok) setActividades(await res.json());
    } finally {
      setLoadingActs(false);
    }
  };

  const createActividad = async () => {
    if (!actModal || !actForm.tipo || !actForm.asunto) return;
    const res = await fetch(`/api/oportunidades/${actModal.id}/actividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...actForm,
        scheduledAt: actForm.scheduledAt || null,
        nextActionDate: actForm.nextActionDate || null,
      }),
    });
    if (res.ok) {
      setActForm({ tipo: 'llamada', asunto: '', notas: '', scheduledAt: '', nextActionDate: '' });
      setShowActForm(false);
      // Refresh activities list and kanban counts
      const actsRes = await fetch(`/api/oportunidades/${actModal.id}/actividades`);
      if (actsRes.ok) setActividades(await actsRes.json());
      fetchAll();
    }
  };

  const deleteOp = async (id: string) => {
    if (!confirm('¿Eliminar esta oportunidad?')) return;
    await fetch(`/api/oportunidades/${id}`, { method: 'DELETE' });
    setOportunidades(prev => prev.filter(op => op.id !== id));
  };

  const hasNextAction = (op: Oportunidad) =>
    op.actividades.some(a => a.nextActionDate && new Date(a.nextActionDate) > new Date());

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400">Cargando pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline CRM</h1>
          <p className="text-slate-400 mt-1">{oportunidades.length} oportunidades</p>
        </div>
        <button
          onClick={() => setNewModal({ stageId: stages.find(s => !s.isWon && !s.isLost)?.id ?? '' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva oportunidad
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {stages.map(stage => {
          const stageOps = oportunidades.filter(op => op.stageId === stage.id);
          const isDropTarget = dropTarget === stage.id;
          const total = stageOps.reduce((s, op) => s + (op.monto ?? 0), 0);

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 flex flex-col rounded-2xl border transition-all ${
                isDropTarget ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700/50 bg-slate-800/30'
              }`}
              onDragOver={e => { e.preventDefault(); setDropTarget(stage.id); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Stage header */}
              <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                <span className="font-semibold text-white text-sm flex-1 truncate">{stage.name}</span>
                <span className="text-xs text-slate-500">{stage.probability}%</span>
                <span className="text-xs bg-slate-700/60 text-slate-400 rounded-full px-2 py-0.5 flex-shrink-0">{stageOps.length}</span>
              </div>
              {total > 0 && (
                <div className="px-3 py-1 text-xs text-slate-400 border-b border-slate-700/30">
                  Total: {CLP(total)}
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {stageOps.map(op => (
                  <div
                    key={op.id}
                    draggable
                    onDragStart={() => setDragId(op.id)}
                    onDragEnd={() => { setDragId(null); setDropTarget(null); }}
                    className={`bg-slate-800/80 border rounded-xl p-3 space-y-2 cursor-grab active:cursor-grabbing transition-all select-none ${
                      dragId === op.id ? 'opacity-50 scale-95' : 'hover:border-slate-600/70'
                    } ${!hasNextAction(op) && !stage.isWon && !stage.isLost ? 'border-amber-500/30' : 'border-slate-700/50'}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TIPO_CONFIG[op.tipo]?.color ?? TIPO_CONFIG.proyecto.color}`}>
                        {TIPO_CONFIG[op.tipo]?.label ?? op.tipo}
                      </span>
                      {!hasNextAction(op) && !stage.isWon && !stage.isLost && (
                        <span className="text-xs text-amber-400">⚠</span>
                      )}
                    </div>
                    <p className="font-medium text-white text-sm leading-snug">{op.titulo}</p>
                    <p className="text-slate-400 text-xs">{op.cliente.razonSocial}</p>
                    {op.monto != null && (
                      <p className="text-emerald-400 text-xs font-semibold">{CLP(op.monto, op.moneda)}</p>
                    )}
                    {op.expectedCloseDate && (
                      <p className="text-slate-500 text-xs">
                        Cierre: {new Date(op.expectedCloseDate).toLocaleDateString('es-CL')}
                      </p>
                    )}

                    {/* Cotización vinculada */}
                    {op.cotizacion ? (
                      <div className="flex items-center gap-1.5 text-xs bg-violet-500/10 border border-violet-500/20 rounded-lg px-2 py-1">
                        <svg className="w-3 h-3 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-violet-300 font-mono">{op.cotizacion.numero}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400 capitalize">{op.cotizacion.estado}</span>
                      </div>
                    ) : !stage.isWon && !stage.isLost ? (
                      <Link
                        href={`/admin/cotizaciones?oportunidadId=${op.id}&clienteId=${op.cliente.id}&titulo=${encodeURIComponent(op.titulo)}`}
                        className="flex items-center justify-center gap-1 w-full text-xs py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nueva cotización
                      </Link>
                    ) : null}

                    <div className="flex items-center gap-1 pt-1">
                      <button
                        onClick={() => openActModal(op, true)}
                        className="flex-1 text-xs py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all"
                      >
                        + Actividad
                      </button>
                      <Link
                        href={`/admin/clientes/${op.cliente.id}`}
                        className="flex-1 text-center text-xs py-1 rounded-lg bg-slate-700/40 hover:bg-slate-700/70 text-slate-400 border border-slate-700/50 transition-all"
                      >
                        Cliente
                      </Link>
                      <button
                        onClick={() => deleteOp(op.id)}
                        className="px-2 py-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                      >
                        ×
                      </button>
                    </div>
                    {op._count.actividades > 0 && (
                      <button
                        onClick={() => openActModal(op, false)}
                        className="text-xs text-slate-500 hover:text-cyan-400 transition-colors text-left"
                      >
                        {op._count.actividades} actividad{op._count.actividades !== 1 ? 'es' : ''} · ver historial
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setNewModal({ stageId: stage.id })}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 border border-dashed border-slate-700/50 hover:border-slate-600 rounded-xl transition-all"
                >
                  + Agregar aquí
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Nueva Oportunidad */}
      {newModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Nueva Oportunidad</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cliente *</label>
                <select
                  value={form.clienteId}
                  onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Título *</label>
                <input
                  value={form.titulo}
                  onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Nombre de la oportunidad"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto</label>
                  <input
                    type="number"
                    value={form.monto}
                    onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Moneda</label>
                  <select
                    value={form.moneda}
                    onChange={e => setForm(p => ({ ...p, moneda: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="CLP">CLP</option>
                    <option value="UF">UF</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo de venta *</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="proyecto">Proyecto / Consultoría</option>
                    <option value="licencia">Software / Licencia</option>
                    <option value="equipo">Equipamiento</option>
                    <option value="soporte">Soporte / Mantención</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Etapa</label>
                  <select
                    value={form.stageId}
                    onChange={e => setForm(p => ({ ...p, stageId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    {stages.filter(s => !s.isWon && !s.isLost).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cierre estimado</label>
                <input
                  type="date"
                  value={form.expectedCloseDate}
                  onChange={e => setForm(p => ({ ...p, expectedCloseDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Origen</label>
                <select
                  value={form.source}
                  onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">Sin especificar</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                  <option value="referral">Referido</option>
                  <option value="web">Web</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setNewModal(null)}
                className="flex-1 py-2.5 text-sm text-slate-400 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={createOportunidad}
                disabled={!form.clienteId || !form.titulo}
                className="flex-1 py-2.5 text-sm text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all font-medium"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Motivo de pérdida */}
      {lostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-white">Marcar como Perdida</h3>
            <p className="text-slate-400 text-sm">¿Por qué se perdió esta oportunidad?</p>
            <textarea
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              rows={3}
              placeholder="Describe el motivo de pérdida..."
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setLostModal(null)}
                className="flex-1 py-2 text-sm text-slate-400 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLost}
                disabled={!lostReason.trim()}
                className="flex-1 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl transition-all font-medium"
              >
                Confirmar pérdida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle oportunidad + Timeline actividades */}
      {actModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-700/50 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 uppercase font-medium mb-0.5">{actModal.cliente.razonSocial}</p>
                <h3 className="text-lg font-bold text-white leading-tight">{actModal.titulo}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: actModal.stage.color + '40', color: actModal.stage.color, backgroundColor: actModal.stage.color + '15' }}>
                    {actModal.stage.name}
                  </span>
                  {actModal.monto && (
                    <span className="text-xs text-slate-400">{CLP(actModal.monto, actModal.moneda)}</span>
                  )}
                  {actModal.expectedCloseDate && (
                    <span className="text-xs text-slate-500">Cierre: {new Date(actModal.expectedCloseDate).toLocaleDateString('es-CL')}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setActModal(null); setShowActForm(false); setActForm({ tipo: 'llamada', asunto: '', notas: '', scheduledAt: '', nextActionDate: '' }); }}
                className="text-slate-400 hover:text-white flex-shrink-0 mt-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Timeline + form — scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Nueva actividad toggle */}
              {!showActForm ? (
                <button
                  onClick={() => setShowActForm(true)}
                  className="w-full py-2.5 text-sm text-cyan-400 border border-dashed border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Registrar actividad
                </button>
              ) : (
                <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Nueva actividad</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                      <select
                        value={actForm.tipo}
                        onChange={e => setActForm(p => ({ ...p, tipo: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      >
                        {['llamada', 'reunion', 'correo', 'whatsapp', 'visita', 'nota'].map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Asunto *</label>
                      <input
                        value={actForm.asunto}
                        onChange={e => setActForm(p => ({ ...p, asunto: e.target.value }))}
                        placeholder="Ej: Llamada de seguimiento"
                        autoFocus
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Notas</label>
                    <textarea
                      value={actForm.notas}
                      onChange={e => setActForm(p => ({ ...p, notas: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Fecha / hora</label>
                      <input
                        type="datetime-local"
                        value={actForm.scheduledAt}
                        onChange={e => setActForm(p => ({ ...p, scheduledAt: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Próxima acción</label>
                      <input
                        type="date"
                        value={actForm.nextActionDate}
                        onChange={e => setActForm(p => ({ ...p, nextActionDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowActForm(false); setActForm({ tipo: 'llamada', asunto: '', notas: '', scheduledAt: '', nextActionDate: '' }); }}
                      className="px-3 py-2 text-xs text-slate-400 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={createActividad}
                      disabled={!actForm.asunto}
                      className="flex-1 py-2 text-xs text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg transition-all font-medium"
                    >
                      Guardar actividad
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium mb-3">
                  Historial {actividades.length > 0 ? `· ${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}` : ''}
                </p>

                {loadingActs ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Cargando...</div>
                ) : actividades.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-sm">Sin actividades registradas todavía.</div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700/60" />
                    <div className="space-y-4">
                      {actividades.map(act => {
                        const icons: Record<string, string> = { llamada: '📞', reunion: '🤝', correo: '✉️', whatsapp: '💬', visita: '🚗', nota: '📝' };
                        const icon = icons[act.tipo] || '📌';
                        const dateStr = act.scheduledAt
                          ? new Date(act.scheduledAt).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : new Date(act.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
                        const hasNextAction = act.nextActionDate && new Date(act.nextActionDate) > new Date();
                        const nextActionPast = act.nextActionDate && new Date(act.nextActionDate) <= new Date();

                        return (
                          <div key={act.id} className="relative pl-10">
                            {/* Icon bubble */}
                            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm">
                              {icon}
                            </div>
                            <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-3 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-white leading-tight">{act.asunto}</p>
                                <span className="text-xs text-slate-500 flex-shrink-0">{dateStr}</span>
                              </div>
                              {act.notas && (
                                <p className="text-xs text-slate-400 leading-relaxed">{act.notas}</p>
                              )}
                              {(hasNextAction || nextActionPast) && (
                                <div className={`flex items-center gap-1.5 text-xs mt-1 ${nextActionPast ? 'text-rose-400' : 'text-amber-400'}`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  {nextActionPast ? 'Acción vencida: ' : 'Próxima acción: '}
                                  {new Date(act.nextActionDate!).toLocaleDateString('es-CL')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
