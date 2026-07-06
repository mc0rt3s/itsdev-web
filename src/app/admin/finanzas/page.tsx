'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import FinanzasFacturas from '@/components/admin/FinanzasFacturas';
import FinanzasGastos from '@/components/admin/FinanzasGastos';

type Tab = 'dashboard' | 'facturas' | 'gastos';

interface DashData {
  mes: string;
  año: number;
  ingresos: number;
  gastos: number;
  balance: number;
  pendiente: number;
  ingresosAnt: number;
  gastosAnt: number;
  balanceAnt: number;
  gastosPorCategoria: { name: string; value: number }[];
  trend: { mes: string; ingresos: number; gastos: number; balance: number }[];
}

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const UFFormat = (n: number) =>
  new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const pct = (current: number, prev: number) => {
  if (prev === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - prev) / Math.abs(prev)) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1'];

const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function DashboardTab() {
  const [month, setMonth] = useState(currentMonthStr());
  const [data, setData] = useState<DashData | null>(null);
  const [uf, setUf] = useState<{ valor: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (m: string) => {
    setLoading(true);
    const [dashRes, ufRes] = await Promise.all([
      fetch(`/api/finanzas/dashboard?month=${m}`),
      fetch('/api/finanzas/uf'),
    ]);
    if (dashRes.ok) setData(await dashRes.json());
    if (ufRes.ok) setUf(await ufRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(month); }, [month, fetchData]);

  const kpis = data ? [
    { label: 'Ingresos', value: data.ingresos, prev: data.ingresosAnt, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', positive: true },
    { label: 'Gastos', value: data.gastos, prev: data.gastosAnt, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', positive: false },
    { label: 'Balance', value: data.balance, prev: data.balanceAnt, color: data.balance >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: data.balance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10', border: data.balance >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20', positive: true },
    { label: 'Por cobrar', value: data.pendiente, prev: null, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', positive: true },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {uf && (
            <div className="text-right">
              <p className="text-xs text-slate-500">UF hoy</p>
              <p className="text-lg font-bold text-cyan-400">$ {UFFormat(uf.valor)}</p>
            </div>
          )}
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">Cargando datos...</div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} border ${kpi.border} rounded-2xl p-5`}>
                <p className="text-slate-400 text-xs font-medium mb-1">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{CLP(kpi.value)}</p>
                {kpi.prev !== null && (
                  <p className="text-xs text-slate-500 mt-1">
                    vs. anterior:{' '}
                    <span className={
                      (kpi.value >= kpi.prev && kpi.positive) || (kpi.value <= kpi.prev && !kpi.positive)
                        ? 'text-emerald-400' : 'text-rose-400'
                    }>
                      {pct(kpi.value, kpi.prev)}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Tendencia 6 meses</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} labelStyle={{ color: '#fff' }} formatter={(v: number | undefined) => [CLP(v ?? 0)]} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Gastos por categoría</h2>
              {data.gastosPorCategoria.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Sin gastos en este período</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={data.gastosPorCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {data.gastosPorCategoria.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: number | undefined) => [CLP(v ?? 0)]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {data.gastosPorCategoria.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-slate-400">{cat.name}</span>
                        </div>
                        <span className="text-white font-medium">{CLP(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Balance mensual</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} formatter={(v: number | undefined) => [CLP(v ?? 0)]} />
                <Bar dataKey="balance" name="Balance" radius={[4, 4, 0, 0]}>
                  {data.trend.map((entry, i) => (
                    <Cell key={i} fill={entry.balance >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default function FinanzasPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Resumen' },
    { id: 'facturas', label: 'Facturas' },
    { id: 'gastos', label: 'Gastos' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Finanzas</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-3 font-medium text-sm transition-all ${
              tab === t.id
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'facturas' && (
        <Suspense fallback={<div className="text-slate-400 py-10 text-center">Cargando...</div>}>
          <FinanzasFacturas />
        </Suspense>
      )}
      {tab === 'gastos' && <FinanzasGastos />}
    </div>
  );
}
