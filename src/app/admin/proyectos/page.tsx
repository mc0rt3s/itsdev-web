'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Proyecto {
    id: string;
    nombre: string;
    descripcion: string | null;
    estado: string;
    prioridad: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    presupuesto: number | null;
    avance: number;
    cliente: {
        razonSocial: string;
    };
    clienteId: string;
    _count: {
        tareas: number;
    };
}

interface Cliente {
    id: string;
    razonSocial: string;
}

export default function ProyectosPage() {
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        clienteId: '',
        estado: 'planificacion',
        prioridad: 'media',
        fechaInicio: '',
        fechaFin: '',
        presupuesto: 0,
        avance: 0,
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProyectos();
        fetchClientes();
    }, []);

    const fetchProyectos = async () => {
        try {
            const res = await fetch('/api/proyectos');
            if (res.ok) {
                const data = await res.json();
                setProyectos(data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientes = async () => {
        try {
            const res = await fetch('/api/clientes');
            if (res.ok) {
                const data = await res.json();
                setClientes(data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const openModal = (proyecto?: Proyecto) => {
        if (proyecto) {
            setEditingProyecto(proyecto);
            setFormData({
                nombre: proyecto.nombre,
                descripcion: proyecto.descripcion || '',
                clienteId: proyecto.clienteId,
                estado: proyecto.estado,
                prioridad: proyecto.prioridad,
                fechaInicio: proyecto.fechaInicio ? new Date(proyecto.fechaInicio).toISOString().split('T')[0] : '',
                fechaFin: proyecto.fechaFin ? new Date(proyecto.fechaFin).toISOString().split('T')[0] : '',
                presupuesto: proyecto.presupuesto || 0,
                avance: proyecto.avance,
            });
        } else {
            setEditingProyecto(null);
            setFormData({
                nombre: '',
                descripcion: '',
                clienteId: '',
                estado: 'planificacion',
                prioridad: 'media',
                fechaInicio: '',
                fechaFin: '',
                presupuesto: 0,
                avance: 0,
            });
        }
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProyecto(null);
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            const url = editingProyecto
                ? `/api/proyectos/${editingProyecto.id}`
                : '/api/proyectos';
            const method = editingProyecto ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                fechaInicio: formData.fechaInicio ? new Date(formData.fechaInicio).toISOString() : null,
                fechaFin: formData.fechaFin ? new Date(formData.fechaFin).toISOString() : null,
                presupuesto: Number(formData.presupuesto),
                avance: Number(formData.avance),
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                closeModal();
                fetchProyectos();
            } else {
                const error = await res.json();
                setFormError(error.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            setFormError('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán también sus tareas.')) return;

        try {
            const res = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchProyectos();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredProyectos = proyectos.filter(
        (p) =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            planificacion: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
            desarrollo: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            pruebas: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
            completado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            pausado: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return map[status] || map.planificacion;
    };

    const getPriorityColor = (priority: string) => {
        const map: Record<string, string> = {
            baja: 'text-slate-400',
            media: 'text-cyan-400',
            alta: 'text-amber-400',
            urgente: 'text-red-400',
        };
        return map[priority] || map.media;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Proyectos</h1>
                    <p className="text-slate-400 mt-1">Gestiona el progreso de tus proyectos</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nuevo Proyecto
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
            ) : filteredProyectos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p className="text-lg font-medium">No hay proyectos</p>
                    <p className="text-sm mt-1">Comienza creando tu primer proyecto</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProyectos.map((proyecto) => (
                        <div
                            key={proyecto.id}
                            className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                                        {proyecto.nombre}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">{proyecto.cliente.razonSocial}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(proyecto)}
                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(proyecto.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(proyecto.estado)}`}>
                                    {proyecto.estado.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className={`text-xs font-medium uppercase ${getPriorityColor(proyecto.prioridad)}`}>
                                    {proyecto.prioridad}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Progreso</span>
                                    <span className="text-white font-medium">{proyecto.avance}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
                                        style={{ width: `${proyecto.avance}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                                    <span>{proyecto._count.tareas} Tareas</span>
                                    <span>{proyecto.presupuesto ? `Presupuesto: ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(proyecto.presupuesto)}` : 'Sin presupuesto'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {formError && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nombre del Proyecto <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Desarrollo E-commerce"
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Cliente <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={formData.clienteId}
                                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                >
                                    <option value="">Selecciona un cliente</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Detalles del proyecto..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Prioridad
                                    </label>
                                    <select
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                        <option value="urgente">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Estado
                                    </label>
                                    <select
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="planificacion">Planificación</option>
                                        <option value="desarrollo">Desarrollo</option>
                                        <option value="pruebas">Pruebas</option>
                                        <option value="completado">Completado</option>
                                        <option value="pausado">Pausado</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.fechaInicio}
                                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Fecha Fin Estimada
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.fechaFin}
                                        onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Avance (%)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.avance}
                                            onChange={(e) => setFormData({ ...formData, avance: Number(e.target.value) })}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-white font-mono w-8">{formData.avance}%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Presupuesto
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.presupuesto}
                                        onChange={(e) => setFormData({ ...formData, presupuesto: Number(e.target.value) })}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
