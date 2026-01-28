'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Comunicacion {
    id: string;
    cliente: { id: string; razonSocial: string };
    usuario: { name: string; email: string };
    tipo: string;
    fecha: string;
    resumen: string;
    detalle: string | null;
    resultado: string | null;
}

interface Cliente {
    id: string;
    razonSocial: string;
}

export default function ComunicacionesPage() {
    const toast = useToast();
    const [comunicaciones, setComunicaciones] = useState<Comunicacion[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedComunicacion, setSelectedComunicacion] = useState<Comunicacion | null>(null);
    const [filtroCliente, setFiltroCliente] = useState<string>('');
    const [vistaTimeline, setVistaTimeline] = useState<'normal' | 'diaria'>('normal');
    const [fechaFiltro, setFechaFiltro] = useState<string>(new Date().toISOString().split('T')[0]);
    const [formData, setFormData] = useState({
        clienteId: '',
        tipo: 'email',
        fecha: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        resumen: '',
        detalle: '',
        resultado: '',
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'info'
    });

    // Filtrar comunicaciones
    const comunicacionesFiltradas = comunicaciones.filter(com => {
        // Filtro por cliente
        if (filtroCliente && com.cliente.id !== filtroCliente) return false;
        
        // Filtro por fecha en vista diaria
        if (vistaTimeline === 'diaria') {
            const comFecha = new Date(com.fecha).toISOString().split('T')[0];
            return comFecha === fechaFiltro;
        }
        
        return true;
    });

    // Agrupar comunicaciones por día para vista diaria
    const comunicacionesPorDia = () => {
        const grupos: Record<string, Comunicacion[]> = {};
        comunicacionesFiltradas.forEach(com => {
            const fechaCom = new Date(com.fecha);
            const fechaKey = fechaCom.toLocaleDateString('es-CL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            if (!grupos[fechaKey]) grupos[fechaKey] = [];
            grupos[fechaKey].push(com);
        });
        return grupos;
    };

    const fetchData = async () => {
        try {
            const url = filtroCliente 
                ? `/api/comunicaciones?clienteId=${filtroCliente}`
                : '/api/comunicaciones';
            
            const [comsRes, clientesRes] = await Promise.all([
                fetch(url),
                fetch('/api/clientes')
            ]);

            if (comsRes.ok) {
                const data = await comsRes.json();
                setComunicaciones(data);
            }
            if (clientesRes.ok) setClientes(await clientesRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filtroCliente]);

    const openModal = (comunicacion?: Comunicacion) => {
        if (comunicacion) {
            setSelectedComunicacion(comunicacion);
            setFormData({
                clienteId: comunicacion.cliente.id || '',
                tipo: comunicacion.tipo,
                fecha: new Date(comunicacion.fecha).toISOString().slice(0, 16),
                resumen: comunicacion.resumen,
                detalle: comunicacion.detalle || '',
                resultado: comunicacion.resultado || '',
            });
        } else {
            setSelectedComunicacion(null);
            setFormData({
                clienteId: '',
                tipo: 'email',
                fecha: new Date().toISOString().slice(0, 16),
                resumen: '',
                detalle: '',
                resultado: '',
            });
        }
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedComunicacion(null);
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            const url = selectedComunicacion 
                ? `/api/comunicaciones/${selectedComunicacion.id}`
                : '/api/comunicaciones';
            const method = selectedComunicacion ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(selectedComunicacion ? 'Comunicación actualizada' : 'Comunicación registrada');
                closeModal();
                fetchData();
            } else {
                const error = await res.json();
                setFormError(error.error || 'Error al guardar');
                toast.error(error.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            setFormError('Error al guardar');
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Comunicación',
            message: '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                try {
                    const res = await fetch(`/api/comunicaciones/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        toast.success('Comunicación eliminada');
                        fetchData();
                    } else {
                        const error = await res.json();
                        toast.error(error.error || 'Error al eliminar');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    toast.error('Error al eliminar');
                }
            }
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'email':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            case 'telefono':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                );
            case 'reunion':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case 'whatsapp':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            default: // other
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                );
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'email': return 'bg-blue-500/20 text-blue-400';
            case 'telefono': return 'bg-green-500/20 text-green-400';
            case 'reunion': return 'bg-purple-500/20 text-purple-400';
            case 'whatsapp': return 'bg-emerald-500/20 text-emerald-400';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Comunicaciones</h1>
                    <p className="text-slate-400 mt-1">Historial de interacciones con clientes</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Registrar Comunicación
                </button>
            </div>

            {/* Filtros y Vista */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Cliente:</label>
                        <select
                            value={filtroCliente}
                            onChange={(e) => setFiltroCliente(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 outline-none min-w-[180px]"
                        >
                            <option value="">Todos los clientes</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Vista:</label>
                        <div className="flex gap-1 bg-slate-900/50 rounded-lg p-0.5">
                            <button
                                onClick={() => setVistaTimeline('normal')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                    vistaTimeline === 'normal'
                                        ? 'bg-cyan-500 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                Normal
                            </button>
                            <button
                                onClick={() => setVistaTimeline('diaria')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                    vistaTimeline === 'diaria'
                                        ? 'bg-cyan-500 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                Diaria
                            </button>
                        </div>
                    </div>
                    {vistaTimeline === 'diaria' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Fecha:</label>
                            <input
                                type="date"
                                value={fechaFiltro}
                                onChange={(e) => setFechaFiltro(e.target.value)}
                                className="px-3 py-1.5 text-sm bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="relative">
                <div className="absolute top-0 bottom-0 left-8 w-px bg-slate-700/50"></div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 pl-16">
                        <svg className="animate-spin w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                ) : comunicacionesFiltradas.length === 0 ? (
                    <div className="pl-16 py-10 text-slate-400">
                        <p>{vistaTimeline === 'diaria' ? 'No hay comunicaciones para esta fecha.' : 'No hay comunicaciones registradas.'}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {vistaTimeline === 'diaria' ? (
                            // Vista agrupada por día
                            Object.entries(comunicacionesPorDia())
                                .map(([fecha, coms]) => (
                                    <div key={fecha} className="space-y-4">
                                        <div className="pl-16">
                                            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg px-4 py-2 inline-block">
                                                <h3 className="text-lg font-bold text-cyan-400 capitalize">{fecha}</h3>
                                            </div>
                                        </div>
                                        {coms.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((com) => renderComunicacion(com))}
                                    </div>
                                ))
                        ) : (
                            // Vista normal
                            comunicacionesFiltradas.map((com) => renderComunicacion(com))
                        )}
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
                                {selectedComunicacion ? 'Editar Comunicación' : 'Registrar Comunicación'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
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
                                <label className="block text-sm font-medium text-slate-300 mb-2">Cliente <span className="text-red-400">*</span></label>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    >
                                        <option value="email">Email</option>
                                        <option value="telefono">Teléfono</option>
                                        <option value="reunion">Reunión</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Fecha</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Resumen <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={formData.resumen}
                                    onChange={(e) => setFormData({ ...formData, resumen: e.target.value })}
                                    placeholder="Ej: Reunión de avance proyecto"
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Detalle</label>
                                <textarea
                                    value={formData.detalle}
                                    onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                                    placeholder="Descripción detallada..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Resultado / Acuerdos</label>
                                <input
                                    type="text"
                                    value={formData.resultado}
                                    onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                                    placeholder="Ej: Cliente aprueba presupuesto"
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-all">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {saving ? 'Guardando...' : selectedComunicacion ? 'Actualizar' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
        </div>
    );

    function renderComunicacion(com: Comunicacion) {
        return (
            <div key={com.id} className="relative pl-16">
                <div className={`absolute left-4 top-2 -ml-2.5 w-9 h-9 rounded-full border-4 border-slate-900 flex items-center justify-center ${getBgColor(com.tipo)}`}>
                    {getTypeIcon(com.tipo)}
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-lg">{com.cliente.razonSocial}</h3>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">{com.tipo}</span>
                            </div>
                            <span className="text-sm text-cyan-400 font-medium">{com.resumen}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{new Date(com.fecha).toLocaleString('es-CL')}</span>
                            <button 
                                onClick={() => openModal(com)} 
                                className="text-slate-500 hover:text-cyan-400 transition-colors"
                                title="Editar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button onClick={() => handleDelete(com.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Eliminar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {com.detalle && <p className="text-slate-300 text-sm mb-3 bg-slate-900/30 p-3 rounded-lg">{com.detalle}</p>}
                    <div className="flex justify-between items-center text-xs border-t border-slate-700/50 pt-3 mt-3">
                        <span className="text-slate-500">Registrado por <span className="text-slate-400">{com.usuario.name}</span></span>
                        {com.resultado && (
                            <span className="text-emerald-400">Resultado: {com.resultado}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
