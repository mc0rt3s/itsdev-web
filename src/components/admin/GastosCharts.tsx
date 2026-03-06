'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface GastosChartsProps {
  porCategoria: Array<{ categoria: string; total: number; cantidad: number }>;
  porProveedor: Array<{ proveedor: string; total: number; cantidad: number }>;
  tendenciaMensual: Array<{ mes: string; total: number; cantidad: number }>;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const getCategoriaLabel = (categoria: string) => {
  const labels: Record<string, string> = {
    servicios: 'Servicios',
    insumos: 'Insumos',
    software: 'Software',
    hardware: 'Hardware',
    marketing: 'Marketing',
    otros: 'Otros',
  };
  return labels[categoria] || categoria;
};

export default function GastosCharts({ porCategoria, porProveedor, tendenciaMensual }: GastosChartsProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipValue = (value: unknown) => {
    const parsed = typeof value === 'number' ? value : Number(value ?? 0);
    return formatPrice(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Torta - Gastos por Categoría */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Gastos por Categoría</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={porCategoria}
              cx="50%"
              cy="50%"
              labelLine={false}
              nameKey="categoria"
              label={({ name, percent }) =>
                `${getCategoriaLabel(String(name ?? 'otros'))} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="total"
            >
              {porCategoria.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatTooltipValue(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {porCategoria.map((item, index) => (
            <div key={item.categoria} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-300">{getCategoriaLabel(item.categoria)}</span>
              </div>
              <span className="text-white font-medium">{formatPrice(item.total)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Barras - Top Proveedores */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Top Proveedores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={porProveedor.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="proveedor"
              stroke="#94a3b8"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => formatPrice(value)} />
            <Tooltip formatter={(value) => formatTooltipValue(value)} />
            <Bar dataKey="total" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Línea - Tendencias Mensuales */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 lg:col-span-2">
        <h3 className="text-lg font-bold text-white mb-4">Tendencia de Gastos (Últimos 6 Meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendenciaMensual}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => formatPrice(value)} />
            <Tooltip formatter={(value) => formatTooltipValue(value)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#06b6d4"
              strokeWidth={3}
              name="Total Gastos"
              dot={{ fill: '#06b6d4', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
