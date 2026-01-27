'use client';

import { useState, useEffect } from 'react';

interface Servicio {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    tipo: string;
    categoria: string;
    activo: boolean;
    createdAt: string;
}

export default function ServiciosPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: 0,
        tipo: 'mensual',
        categoria: 'general',
        activo: true,
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchServicios();
    }, []);

    const fetchServicios = async () => {
        try {
            const res = await fetch('/api/servicios');
            if (res.ok) {
                const data = await res.json();
                setServicios(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (servicio?: Servicio) => {
        if (servicio) {
            setEditingServicio(servicio);
            setFormData({
                nombre: servicio.nombre,
                descripcion: servicio.descripcion || '',
                precio: servicio.precio,
                tipo: servicio.tipo,
                categoria: servicio.categoria,
                activo: servicio.activo,
            });
        } else {
            setEditingServicio(null);
            setFormData({
                nombre: '',
                descripcion: '',
                precio: 0,
                tipo: 'mensual',
                categoria: 'general',
                activo: true,
            });
        }
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingServicio(null);
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            const url = editingServicio
                ? `/api/servicios/${editingServicio.id}`
                : '/api/servicios';
            const method = editingServicio ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                closeModal();
                fetchServicios();
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
        if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

        try {
            const res = await fetch(`/api/servicios/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchServicios();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredServicios = servicios.filter(
        (s) =>
            s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Servicios</h1>
                    <p className="text-slate-400 mt-1">Gestiona tu catálogo de servicios</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nuevo Servicio
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
                    placeholder="Buscar por nombre o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                ) : filteredServicios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-lg font-medium">No hay servicios</p>
                        <p className="text-sm mt-1">Comienza agregando tu primer servicio</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Nombre</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Precio</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Tipo</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Categoría</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Estado</th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServicios.map((servicio) => (
                                    <tr
                                        key={servicio.id}
                                        className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="text-white font-medium">{servicio.nombre}</p>
                                                {servicio.descripcion && (
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{servicio.descripcion}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-emerald-400 font-mono font-medium">{formatPrice(servicio.precio)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-slate-300 capitalize">{servicio.tipo}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-2 py-1 text-xs rounded-md bg-slate-700 text-slate-300 capitalize">
                                                {servicio.categoria}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${servicio.activo
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                                                    }`}
                                            >
                                                {servicio.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(servicio)}
                                                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(servicio.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
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
                                    Nombre <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Hosting Corporativo"
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Detalles del servicio..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Precio <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.precio}
                                        onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Tipo
                                    </label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="mensual">Mensual</option>
                                        <option value="anual">Anual</option>
                                        <option value="unico">Pago Único</option>
                                        <option value="hora">Por Hora</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Categoría
                                    </label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="general">General</option>
                                        <option value="hosting">Hosting</option>
                                        <option value="desarrollo">Desarrollo</option>
                                        <option value="mantenimiento">Mantenimiento</option>
                                        <option value="consultoria">Consultoría</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-8">
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.activo}
                                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                                className="sr-only"
                                            />
                                            <div className={`block w-14 h-8 rounded-full transition-colors ${formData.activo ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-700/50 border border-slate-600/50'}`}></div>
                                            <div className={`dot absolute left-1 top-1 w-6 h-6 rounded-full transition-transform ${formData.activo ? 'transform translate-x-6 bg-emerald-400' : 'bg-slate-400'}`}></div>
                                        </div>
                                        <div className="ml-3 text-sm font-medium text-slate-300">
                                            Activo
                                        </div>
                                    </label>
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
