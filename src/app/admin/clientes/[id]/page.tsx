'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  clockifyProjectId: string | null;
  _count: { tareas: number };
}

interface Cliente {
  id: string;
  rut: string;
  razonSocial: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  estado: string;
  clockifyClientId: string | null;
  facturaPorTiempo: boolean;
  proyectos: Proyecto[];
}

interface ReportEntry {
  id?: string;
  description: string;
  projectName: string;
  taskName: string;
  userName: string;
  start?: string;
  end?: string;
  horas: number;
  tipoHora: string;
}

interface ReportResumen {
  horasHabil: number;
  horasInhabil: number;
  totalHoras: number;
}

export default function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [reportWorkspaceId, setReportWorkspaceId] = useState('');
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportEntries, setReportEntries] = useState<ReportEntry[]>([]);
  const [reportResumen, setReportResumen] = useState<ReportResumen | null>(null);

  useEffect(() => {
    params.then((p) => setClienteId(p.id));
  }, [params]);

  useEffect(() => {
    if (!clienteId) return;
    const fetchCliente = async () => {
      try {
        const res = await fetch(`/api/clientes/${clienteId}`);
        if (res.ok) {
          const data = await res.json();
          setCliente(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCliente();
  }, [clienteId]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/clockify/workspaces');
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(Array.isArray(data) ? data : []);
        }
      } catch {
        setWorkspaces([]);
      }
    };
    fetchWorkspaces();
  }, []);

  const formatRut = (rut: string) => {
    const cleaned = rut.replace(/[^0-9kK]/g, '');
    if (cleaned.length < 2) return cleaned;
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      activo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      inactivo: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      prospecto: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return styles[estado] || styles.activo;
  };

  const generarReporte = async () => {
    if (!clienteId || !reportWorkspaceId || !reportStart || !reportEnd) {
      setReportError('Completa workspace y rango de fechas.');
      return;
    }
    setReportLoading(true);
    setReportError('');
    setReportResumen(null);
    setReportEntries([]);
    try {
      const url = `/api/clockify/report/horas?clienteId=${encodeURIComponent(clienteId)}&workspaceId=${encodeURIComponent(reportWorkspaceId)}&start=${encodeURIComponent(reportStart)}&end=${encodeURIComponent(reportEnd)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || 'Error al generar reporte');
        return;
      }
      setReportEntries(data.entries ?? []);
      setReportResumen(data.resumen ?? null);
      if (data.message) setReportError(data.message);
    } catch {
      setReportError('Error al conectar con el servidor');
    } finally {
      setReportLoading(false);
    }
  };

  const formatHoras = (h: number) => {
    const hrs = Math.floor(h);
    const min = Math.round((h - hrs) * 60);
    if (min === 0) return `${hrs}h`;
    return `${hrs}h ${min}m`;
  };

  const formatEntryDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  if (loading || !cliente) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg className="animate-spin w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const proyectosConClockify = cliente.proyectos.filter((p) => p.clockifyProjectId);

  return (
    <div className="space-y-8">
      {/* Breadcrumb y header */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <Link href="/admin/clientes" className="hover:text-cyan-400 transition-colors">
            Clientes
          </Link>
          <span>/</span>
          <span className="text-white">{cliente.razonSocial}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{cliente.razonSocial}</h1>
            <p className="text-slate-400 mt-1 font-mono text-sm">{formatRut(cliente.rut)}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getEstadoBadge(cliente.estado)}`}>
                {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
              </span>
              {cliente.clockifyClientId && (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                  Clockify
                </span>
              )}
              {cliente.facturaPorTiempo && (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  Factura por tiempo
                </span>
              )}
            </div>
          </div>
          <Link
            href="/admin/clientes"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a clientes
          </Link>
        </div>
        {(cliente.contacto || cliente.email || cliente.telefono) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            {cliente.contacto && <span>Contacto: {cliente.contacto}</span>}
            {cliente.email && <a href={`mailto:${cliente.email}`} className="hover:text-cyan-400">{cliente.email}</a>}
            {cliente.telefono && <span>{cliente.telefono}</span>}
          </div>
        )}
      </div>

      {/* Proyectos del cliente */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Proyectos</h2>
            <p className="text-sm text-slate-400 mt-0.5">Proyectos asociados a este cliente (para reporte de horas se usan los vinculados a Clockify)</p>
          </div>
          <Link
            href={`/admin/proyectos?nuevoClienteId=${cliente.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo proyecto
          </Link>
        </div>
        <div className="p-6">
          {cliente.proyectos.length === 0 ? (
            <p className="text-slate-400">
              No hay proyectos.{' '}
              <Link href={`/admin/proyectos?nuevoClienteId=${cliente.id}`} className="text-cyan-400 hover:underline">
                Crear proyecto para este cliente
              </Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {cliente.proyectos.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 bg-slate-900/50 rounded-xl border border-slate-700/30"
                >
                  <div>
                    <span className="font-medium text-white">{p.nombre}</span>
                    {p.descripcion && <p className="text-sm text-slate-400 mt-0.5">{p.descripcion}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{p.estado}</span>
                      {(p._count?.tareas ?? 0) > 0 && <span className="text-xs text-slate-500">{p._count.tareas} tareas</span>}
                      {p.clockifyProjectId && (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                          Clockify
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/proyectos?clienteId=${cliente.id}`}
                    className="text-sm text-cyan-400 hover:underline"
                  >
                    Ver en Proyectos
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Reporte de horas para facturación */}
      {cliente.facturaPorTiempo && proyectosConClockify.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Reporte de horas para facturación</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Horas invertidas por el cliente en Clockify: solo proyectos del CRM vinculados a Clockify, en el rango de fechas elegido. Detalle por entrada de tiempo (proyecto, tarea, usuario, fecha/hora inicio y fin, horas, tipo hábil/inhábil).
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-slate-300 mb-1">Workspace Clockify</label>
                <select
                  value={reportWorkspaceId}
                  onChange={(e) => setReportWorkspaceId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">Seleccionar...</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Desde</label>
                <input
                  type="date"
                  value={reportStart}
                  onChange={(e) => setReportStart(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hasta</label>
                <input
                  type="date"
                  value={reportEnd}
                  onChange={(e) => setReportEnd(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <button
                onClick={generarReporte}
                disabled={reportLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
              >
                {reportLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.5a2 2 0 012 2v5a2 2 0 01-2 2z" />
                    </svg>
                    Generar reporte
                  </>
                )}
              </button>
            </div>

            {reportError && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-xl text-sm">
                {reportError}
              </div>
            )}

            {reportResumen && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm">Hora hábil</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatHoras(reportResumen.horasHabil)}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm">Hora inhábil</p>
                  <p className="text-2xl font-bold text-amber-400">{formatHoras(reportResumen.horasInhabil)}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{formatHoras(reportResumen.totalHoras)}</p>
                </div>
              </div>
            )}

            {reportEntries.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-200 font-medium">Inicio</th>
                      <th className="text-left py-3 px-4 text-slate-200 font-medium">Fin</th>
                      <th className="text-left py-3 px-4 text-slate-200 font-medium">Proyecto</th>
                      <th className="text-left py-3 px-4 text-slate-200 font-medium">Tarea</th>
                      <th className="text-left py-3 px-4 text-slate-200 font-medium">Usuario</th>
                      <th className="text-left py-3 px-4 text-slate-200 font-medium">Descripción</th>
                      <th className="text-right py-3 px-4 text-slate-200 font-medium">Horas</th>
                      <th className="text-center py-3 px-4 text-slate-200 font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportEntries.map((e, i) => (
                      <tr key={e.id || i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{formatEntryDate(e.start)}</td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{formatEntryDate(e.end)}</td>
                        <td className="py-2.5 px-4 text-slate-100">{e.projectName || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-300">{e.taskName || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-300">{e.userName || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-400 min-w-[120px] max-w-[280px]" title={e.description || undefined}>
                          <span className="break-words">{e.description || '-'}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-100 font-mono">{formatHoras(e.horas)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${e.tipoHora === 'habil' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {e.tipoHora === 'habil' ? 'Hábil' : 'Inhábil'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {cliente.facturaPorTiempo && proyectosConClockify.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <p className="text-slate-400">
            Este cliente está marcado para factura por tiempo pero no tiene proyectos vinculados a Clockify. Vincula al menos un proyecto en la sección Proyectos para poder generar el reporte de horas.
          </p>
        </div>
      )}
    </div>
  );
}
