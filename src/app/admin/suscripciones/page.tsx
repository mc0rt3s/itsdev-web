'use client';

import { useState, useEffect } from 'react';

interface Suscripcion {
    id: string;
    cliente: { razonSocial: string };
    clienteId: string;
    servicio: { nombre: string; tipo: string };
    servicioId: string;
    precio: number;
    ciclo: string;
    fechaInicio: string;
    fechaFin: string | null;
    proxCobro: string | null;
    estado: string;
    notas: string | null;
}

interface Cliente {
    id: string;
    razonSocial: string;
}

interface Servicio {
    id: string;
    nombre: string;
    precio: number;
    tipo: string;
}

export default function SuscripcionesPage() {
    const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSuscripcion, setEditingSuscripcion] = useState<Suscripcion | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        clienteId: '',
        servicioId: '',
        precio: 0,
        ciclo: 'mensual',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        estado: 'activa',
        notas: '',
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subsRes, clientesRes, serviciosRes] = await Promise.all([
                fetch('/api/suscripciones'),
                fetch('/api/clientes'),
                fetch('/api/servicios')
            ]);

            if (subsRes.ok) setSuscripciones(await subsRes.json());
            if (clientesRes.ok) setClientes(await clientesRes.json());
            if (serviciosRes.ok) setServicios(await serviciosRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServicioChange = (servicioId: string) => {
        const servicio = servicios.find(s => s.id === servicioId);
        setFormData(prev => ({
            ...prev,
            servicioId,
            precio: servicio ? servicio.precio : 0,
            ciclo: servicio ? servicio.tipo : 'mensual'
        }));
    };

    const openModal = (sub?: Suscripcion) => {
        if (sub) {
            setEditingSuscripcion(sub);
            setFormData({
                clienteId: sub.clienteId,
                servicioId: sub.servicioId,
                precio: sub.precio,
                ciclo: sub.ciclo,
                fechaInicio: sub.fechaInicio.split('T')[0],
                fechaFin: sub.fechaFin ? sub.fechaFin.split('T')[0] : '',
                estado: sub.estado,
                notas: sub.notas || '',
            });
        } else {
            setEditingSuscripcion(null);
            setFormData({
                clienteId: '',
                servicioId: '',
                precio: 0,
                ciclo: 'mensual',
                fechaInicio: new Date().toISOString().split('T')[0],
                fechaFin: '',
                estado: 'activa',
                notas: '',
            });
        }
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSuscripcion(null);
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            const url = editingSuscripcion
                ? `/api/suscripciones/${editingSuscripcion.id}` // Note: PUT not implemented yet in backend for generic Update, mostly for creation flow. But let's assume we might add it or re-create. Wait, I didn't implement PUT in backend for Suscripciones, only GET/POST/DELETE.
                : '/api/suscripciones';

            // If editing, user might expect update. 
            // Current backend only has DELETE (cancel).
            // Let's implement creating new ones only for now, or assume I added PUT.
            // Checking backend... api/suscripciones has GET, POST. api/suscripciones/[id] has GET, DELETE.
            // So Edit is NOT supported yet. I should restrict Modal to Create only or Update backend.
            // I will restrict UI to Create only for now to match backend, or maybe "Cancel" action.
            // Actually, editing active subscriptions (price change) is common. I should probably add PUT support to backend. 
            // for now let's just allow creating active ones and cancelling existing ones.

            if (editingSuscripcion) {
                setFormError('La edición no está implementada aún. Cancele la suscripción y cree una nueva.');
                setSaving(false);
                return;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                closeModal();
                fetchData();
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

    const handleCancel = async (id: string) => {
        if (!confirm('¿Estás seguro de cancelar esta suscripción?')) return;

        try {
            const res = await fetch(`/api/suscripciones/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredSuscripciones = suscripciones.filter(
        (s) =>
            s.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-CL');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Suscripciones</h1>
                    <p className="text-slate-400 mt-1">Gestiona servicios recurrentes y cobros</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nueva Suscripción
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
                    placeholder="Buscar por cliente o servicio..."
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
                ) : filteredSuscripciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-lg font-medium">No hay suscripciones</p>
                        <p className="text-sm mt-1">Crea suscripciones para tus clientes recurrentes</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Cliente</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Servicio</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Ciclo</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Precio</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Próx. Cobro</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Estado</th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuscripciones.map((sub) => (
                                    <tr
                                        key={sub.id}
                                        className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <p className="text-white font-medium">{sub.cliente.razonSocial}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-slate-300">{sub.servicio.nombre}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-slate-300 capitalize">{sub.ciclo}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-emerald-400 font-mono font-medium">{formatPrice(sub.precio)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-slate-300">{formatDate(sub.proxCobro)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${sub.estado === 'activa'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : sub.estado === 'cancelada'
                                                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                    }`}
                                            >
                                                {sub.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                {sub.estado === 'activa' && (
                                                    <button
                                                        onClick={() => handleCancel(sub.id)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                        title="Cancelar Suscripción"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
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
                                {editingSuscripcion ? 'Detalle Suscripción' : 'Nueva Suscripción'}
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

                            {/* Readonly mode warning if editing */}
                            {editingSuscripcion && (
                                <div className="bg-blue-500/10 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-xl text-sm">
                                    Para modificar una suscripción, cancela la actual y crea una nueva.
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Cliente <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={formData.clienteId}
                                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                    disabled={!!editingSuscripcion}
                                >
                                    <option value="">Selecciona un cliente</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Servicio <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={formData.servicioId}
                                    onChange={(e) => handleServicioChange(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                    disabled={!!editingSuscripcion}
                                >
                                    <option value="">Selecciona un servicio base</option>
                                    {servicios.map(servicio => (
                                        <option key={servicio.id} value={servicio.id}>{servicio.nombre} ({formatPrice(servicio.precio)})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Precio Acordado
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.precio}
                                        onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        min="0"
                                        required
                                        disabled={!!editingSuscripcion}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Ciclo
                                    </label>
                                    <select
                                        value={formData.ciclo}
                                        onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        disabled={!!editingSuscripcion}
                                    >
                                        <option value="mensual">Mensual</option>
                                        <option value="trimestral">Trimestral</option>
                                        <option value="anual">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Fecha Inicio
                                </label>
                                <input
                                    type="date"
                                    value={formData.fechaInicio}
                                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                    disabled={!!editingSuscripcion}
                                />
                            </div>

                            {!editingSuscripcion && (
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
                                        {saving ? 'Guardando...' : 'Crear Suscripción'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
