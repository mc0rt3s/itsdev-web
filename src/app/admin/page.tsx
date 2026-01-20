import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300', icon: 'text-slate-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300', icon: 'text-cyan-400' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-300', icon: 'text-violet-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', icon: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', icon: 'text-amber-400' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300', icon: 'text-rose-400' },
};

export default async function AdminDashboard() {
  const session = await auth();
  
  // Obtener estadísticas y notas favoritas
  const [clientesCount, accesosCount, notasCount, usuariosCount, notasFavoritas] = await Promise.all([
    prisma.cliente.count(),
    prisma.acceso.count(),
    prisma.nota.count(),
    prisma.user.count(),
    prisma.nota.findMany({
      where: { favorita: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ]);

  const stats = [
    {
      name: 'Clientes',
      value: clientesCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-cyan-500 to-cyan-600',
      href: '/admin/clientes',
    },
    {
      name: 'Accesos',
      value: accesosCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      color: 'from-violet-500 to-violet-600',
      href: '/admin/accesos',
    },
    {
      name: 'Notas',
      value: notasCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600',
      href: '/admin/notas',
    },
    {
      name: 'Usuarios',
      value: usuariosCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'from-amber-500 to-amber-600',
      href: '/admin/usuarios',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          ¡Hola, {session?.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400 mt-1">
          Bienvenido al panel de administración de itsDev
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <a
            key={stat.name}
            href={stat.href}
            className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{stat.name}</p>
                <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                {stat.icon}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </a>
        ))}
      </div>

      {/* Notas Favoritas */}
      {notasFavoritas.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Notas Importantes</h2>
            </div>
            <Link
              href="/admin/notas"
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Ver todas
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notasFavoritas.map((nota) => {
              const colors = colorClasses[nota.color] || colorClasses.slate;
              return (
                <Link
                  key={nota.id}
                  href={`/admin/notas?edit=${nota.id}`}
                  className={`group p-4 rounded-xl border ${colors.bg} ${colors.border} hover:scale-[1.02] transition-all duration-200`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${colors.icon}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${colors.text} truncate group-hover:text-white transition-colors`}>
                        {nota.titulo}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                        {nota.contenido}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/clientes?new=true"
            className="flex items-center gap-3 p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
          >
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="text-slate-300 group-hover:text-white font-medium">Nuevo Cliente</span>
          </a>
          <a
            href="/admin/accesos?new=true"
            className="flex items-center gap-3 p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
          >
            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-slate-300 group-hover:text-white font-medium">Nuevo Acceso</span>
          </a>
          <a
            href="/admin/notas?new=true"
            className="flex items-center gap-3 p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-slate-300 group-hover:text-white font-medium">Nueva Nota</span>
          </a>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-slate-500 text-sm">
        <p>itsDev Admin Panel • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
