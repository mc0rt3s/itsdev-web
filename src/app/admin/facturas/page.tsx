'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Factura {
    id: string;
    numero: string;
    numeroSII?: string | null;
    cliente: { razonSocial: string };
    clienteId: string;
    fechaEmision: string;
    fechaVenc: string;
    estado: string;
    subtotal: number;
    impuesto: number;
    total: number;
    items: ItemFactura[];
}

interface ItemFactura {
    descripcion: string;
    cantidad: number;
    precioUnit: number;
    total?: number;
}

interface Cliente {
    id: string;
    razonSocial: string;
}

interface DashboardData {
    flujoCaja: {
        totalEmitido: number;
        totalPagado: number;
        totalPendiente: number;
        totalVencido: number;
        totalCancelado: number;
    };
    porEstado: Record<string, number>;
    topClientes: Array<{ nombre: string; total: number; cantidad: number }>;
    topServicios: Array<{ nombre: string; categoria: string; total: number; cantidad: number }>;
    flujoMensual: Array<{ mes: string; emitido: number; pagado: number }>;
    periodo: string;
}

export default function FacturasPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'lista'>('dashboard');
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'año'>('mes');
    const [showModal, setShowModal] = useState(false);
    const [viewingFactura, setViewingFactura] = useState<Factura | null>(null);
    const [formData, setFormData] = useState({
        clienteId: '',
        numero: '',
        numeroSII: '',
        fechaEmision: new Date().toISOString().split('T')[0],
        fechaVenc: '',
        estado: 'emitida',
        items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
        notas: '',
        aplicarIVA: true
    });
    const [updatingEstado, setUpdatingEstado] = useState(false);
    const [tempEstado, setTempEstado] = useState<string | null>(null);
    const [tempNumeroSII, setTempNumeroSII] = useState<string | null>(null);
    const [savingNumeroSII, setSavingNumeroSII] = useState(false);
    const [updatingEstados, setUpdatingEstados] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel?: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: undefined,
        type: 'info'
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchDashboard();
        }
    }, [activeTab, periodo]);

    const fetchData = async () => {
        try {
            const [facturasRes, clientesRes] = await Promise.all([
                fetch('/api/facturas'),
                fetch('/api/clientes')
            ]);
            if (facturasRes.ok) setFacturas(await facturasRes.json());
            if (clientesRes.ok) setClientes(await clientesRes.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboard = async () => {
        setDashboardLoading(true);
        try {
            const res = await fetch(`/api/facturas/dashboard?periodo=${periodo}`);
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setDashboardLoading(false);
        }
    };

    const openNewModal = () => {
        setViewingFactura(null);
        setFormData({
            clienteId: '',
            numero: `FAC-${new Date().getFullYear()}-${String(facturas.length + 1).padStart(3, '0')}`,
            numeroSII: '',
            fechaEmision: new Date().toISOString().split('T')[0],
            fechaVenc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estado: 'emitida',
            items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
            notas: '',
            aplicarIVA: true
        });
        setShowModal(true);
    };

    const openDetailModal = (factura: Factura) => {
        setViewingFactura(factura);
        setTempNumeroSII(null); // Resetear el estado temporal
        setTempEstado(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setViewingFactura(null);
        setTempEstado(null);
        setTempNumeroSII(null);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { descripcion: '', cantidad: 1, precioUnit: 0 }]
        });
    };

    const updateItem = (index: number, field: keyof ItemFactura, value: string | number) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateSubtotal = (items: ItemFactura[]) => {
        return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnit), 0);
    };

    const calculateIVA = (subtotal: number, aplicar: boolean) => {
        return aplicar ? Math.round(subtotal * 0.19) : 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/facturas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('Factura creada exitosamente');
                closeModal();
                fetchData();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al crear factura');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async (id: string) => {
        window.open(`/api/facturas/${id}/pdf`, '_blank');
    };

    const handleSendEmail = async (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Enviar Factura',
            message: '¿Deseas enviar esta factura por email al cliente?',
            type: 'info',
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                setSendingEmail(true);
                try {
                    const res = await fetch(`/api/facturas/${id}/enviar`, { method: 'POST' });
                    if (res.ok) {
                        toast.success('Factura enviada exitosamente');
                        fetchData();
                    } else {
                        const error = await res.json();
                        toast.error(error.error || 'Error al enviar factura');
                    }
                } catch (error) {
                    toast.error('Error al enviar factura');
                } finally {
                    setSendingEmail(false);
                }
            }
        });
    };

    const handleUpdateEstado = async (id: string, nuevoEstado: string, facturaActual?: Factura) => {
        const estadoActual = facturaActual?.estado || viewingFactura?.estado;
        if (estadoActual === nuevoEstado) {
            if (facturaActual) {
                // Si es desde la tabla, no hay tempEstado
                return;
            }
            setTempEstado(null);
            return;
        }

        // Si es desde la tabla, usar el estado de la factura directamente
        if (facturaActual) {
            setConfirmDialog({
                isOpen: true,
                title: 'Cambiar Estado',
                message: `¿Deseas cambiar el estado de la factura a "${nuevoEstado}"?`,
                type: nuevoEstado === 'cancelada' ? 'danger' : 'info',
                onConfirm: async () => {
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                    setUpdatingEstados(prev => ({ ...prev, [id]: true }));
                    try {
                        const res = await fetch(`/api/facturas/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ estado: nuevoEstado })
                        });
                        if (res.ok) {
                            toast.success(`Estado actualizado a "${nuevoEstado}"`);
                            fetchData();
                            if (activeTab === 'dashboard') fetchDashboard();
                        } else {
                            const error = await res.json();
                            toast.error(error.error || 'Error al actualizar estado');
                        }
                    } catch (error) {
                        toast.error('Error al actualizar estado');
                    } finally {
                        setUpdatingEstados(prev => ({ ...prev, [id]: false }));
                    }
                },
                onCancel: () => {
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            });
            return;
        }

        // Si es desde el modal
        setTempEstado(nuevoEstado);

        setConfirmDialog({
            isOpen: true,
            title: 'Cambiar Estado',
            message: `¿Deseas cambiar el estado de la factura a "${nuevoEstado}"?`,
            type: nuevoEstado === 'cancelada' ? 'danger' : 'info',
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                setUpdatingEstado(true);
                try {
                    const res = await fetch(`/api/facturas/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: nuevoEstado })
                    });
                    if (res.ok) {
                        // Refrescar la factura completa desde el servidor
                        const facturaRes = await fetch(`/api/facturas/${id}`);
                        if (facturaRes.ok) {
                            const facturaActualizada = await facturaRes.json();
                            setViewingFactura(facturaActualizada);
                        }
                        toast.success(`Estado actualizado a "${nuevoEstado}"`);
                        setTempEstado(null);
                        fetchData();
                        if (activeTab === 'dashboard') fetchDashboard();
                    } else {
                        const error = await res.json();
                        toast.error(error.error || 'Error al actualizar estado');
                        setTempEstado(null);
                    }
                } catch (error) {
                    toast.error('Error al actualizar estado');
                    setTempEstado(null);
                } finally {
                    setUpdatingEstado(false);
                }
            },
            onCancel: () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                setTempEstado(null);
            }
        });
    };

    const handleUpdateNumeroSII = async (id: string, numeroSII: string) => {
        setSavingNumeroSII(true);
        try {
            const res = await fetch(`/api/facturas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numeroSII: numeroSII || null })
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
                throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
            }

            const facturaActualizada = await res.json();
            setViewingFactura(facturaActualizada);
            setTempNumeroSII(null); // Limpiar el estado temporal después de guardar
            toast.success('Número SII actualizado');
            fetchData();
        } catch (error: any) {
            console.error('Error al actualizar número SII:', error);
            toast.error(error?.message || 'Error al actualizar número SII');
        } finally {
            setSavingNumeroSII(false);
        }
    };

    const handleSaveNumeroSII = () => {
        if (!viewingFactura) return;
        const nuevoValor = (tempNumeroSII !== null ? tempNumeroSII : viewingFactura.numeroSII || '').trim();
        const valorAnterior = viewingFactura.numeroSII || '';
        if (nuevoValor !== valorAnterior) {
            handleUpdateNumeroSII(viewingFactura.id, nuevoValor);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            emitida: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            enviada: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            pendiente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            pagada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
            vencida: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        };
        return styles[status] || styles.emitida;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Facturas</h1>
                    <p className="text-slate-400 mt-1">Gestión de cobros y pagos</p>
                </div>
                <button onClick={openNewModal} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Nueva Factura
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-3 font-medium transition-colors ${
                        activeTab === 'dashboard'
                            ? 'text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-slate-400 hover:text-slate-300'
                    }`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('lista')}
                    className={`px-6 py-3 font-medium transition-colors ${
                        activeTab === 'lista'
                            ? 'text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-slate-400 hover:text-slate-300'
                    }`}
                >
                    Lista de Facturas
                </button>
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Periodo selector */}
                    <div className="flex justify-end gap-2">
                        {(['mes', 'trimestre', 'año'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriodo(p)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    periodo === p
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {p === 'mes' ? 'Este Mes' : p === 'trimestre' ? 'Este Trimestre' : 'Este Año'}
                            </button>
                        ))}
                    </div>

                    {dashboardLoading ? (
                        <div className="p-20 text-center text-slate-400">Cargando dashboard...</div>
                    ) : dashboardData ? (
                        <>
                            {/* Flujo de Caja */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
                                    <p className="text-blue-400 text-sm font-medium mb-2">Total Emitido</p>
                                    <p className="text-2xl font-bold text-white">{formatPrice(dashboardData.flujoCaja.totalEmitido)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-6">
                                    <p className="text-emerald-400 text-sm font-medium mb-2">Total Pagado</p>
                                    <p className="text-2xl font-bold text-white">{formatPrice(dashboardData.flujoCaja.totalPagado)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl p-6">
                                    <p className="text-amber-400 text-sm font-medium mb-2">Pendiente</p>
                                    <p className="text-2xl font-bold text-white">{formatPrice(dashboardData.flujoCaja.totalPendiente)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6">
                                    <p className="text-orange-400 text-sm font-medium mb-2">Vencido</p>
                                    <p className="text-2xl font-bold text-white">{formatPrice(dashboardData.flujoCaja.totalVencido)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-6">
                                    <p className="text-red-400 text-sm font-medium mb-2">Cancelado</p>
                                    <p className="text-2xl font-bold text-white">{formatPrice(dashboardData.flujoCaja.totalCancelado)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Clientes */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Top Clientes</h3>
                                    <div className="space-y-3">
                                        {dashboardData.topClientes.length === 0 ? (
                                            <p className="text-slate-400 text-center py-8">No hay datos disponibles</p>
                                        ) : (
                                            dashboardData.topClientes.map((cliente, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{cliente.nombre}</p>
                                                            <p className="text-slate-400 text-xs">{cliente.cantidad} factura{cliente.cantidad !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-400 font-bold">{formatPrice(cliente.total)}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Top Servicios */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Servicios Más Rentables</h3>
                                    <div className="space-y-3">
                                        {dashboardData.topServicios.length === 0 ? (
                                            <p className="text-slate-400 text-center py-8">No hay datos disponibles</p>
                                        ) : (
                                            dashboardData.topServicios.map((servicio, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{servicio.nombre}</p>
                                                            <p className="text-slate-400 text-xs capitalize">{servicio.categoria}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-emerald-400 font-bold">{formatPrice(servicio.total)}</p>
                                                        <p className="text-slate-400 text-xs">{servicio.cantidad} unidad{servicio.cantidad !== 1 ? 'es' : ''}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Flujo Mensual */}
                            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-white mb-6">Flujo Mensual (Últimos 6 Meses)</h3>
                                <div className="space-y-4">
                                    {dashboardData.flujoMensual.map((mes, idx) => {
                                        const maxEmitido = Math.max(...dashboardData.flujoMensual.map(m => m.emitido));
                                        const porcentajeEmitido = maxEmitido > 0 ? (mes.emitido / maxEmitido) * 100 : 0;
                                        const porcentajePagado = maxEmitido > 0 ? (mes.pagado / maxEmitido) * 100 : 0;
                                        
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-slate-300 font-medium">{mes.mes}</p>
                                                    <div className="flex gap-4 text-sm">
                                                        <span className="text-blue-400">Emitido: {formatPrice(mes.emitido)}</span>
                                                        <span className="text-emerald-400">Pagado: {formatPrice(mes.pagado)}</span>
                                                    </div>
                                                </div>
                                                <div className="relative h-8 bg-slate-900 rounded-lg overflow-hidden">
                                                    <div
                                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500/60 to-blue-600/60 rounded-l-lg"
                                                        style={{ width: `${porcentajeEmitido}%` }}
                                                    />
                                                    <div
                                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 rounded-l-lg"
                                                        style={{ width: `${porcentajePagado}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-20 text-center text-slate-400">No hay datos disponibles</div>
                    )}
                </div>
            )}

            {/* Lista Tab */}
            {activeTab === 'lista' && (

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center text-slate-400">Cargando...</div>
                ) : facturas.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">No hay facturas registradas.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50 text-left">
                                    <th className="p-4 text-slate-300">Folio / SII</th>
                                    <th className="p-4 text-slate-300">Cliente</th>
                                    <th className="p-4 text-slate-300">Emisión</th>
                                    <th className="p-4 text-slate-300">Vencimiento</th>
                                    <th className="p-4 text-slate-300">Total</th>
                                    <th className="p-4 text-slate-300">Estado</th>
                                    <th className="p-4 text-slate-300 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facturas.map(f => (
                                    <tr key={f.id} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-cyan-400">{f.numero}</span>
                                                {f.numeroSII && (
                                                    <span className="text-xs text-slate-400 font-mono">SII: {f.numeroSII}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-white font-medium">{f.cliente.razonSocial}</td>
                                        <td className="p-4 text-slate-400">{new Date(f.fechaEmision).toLocaleDateString('es-CL')}</td>
                                        <td className="p-4 text-slate-400">{new Date(f.fechaVenc).toLocaleDateString('es-CL')}</td>
                                        <td className="p-4 text-white font-bold">{formatPrice(f.total)}</td>
                                        <td className="p-4">
                                            <select
                                                value={f.estado}
                                                onChange={(e) => handleUpdateEstado(f.id, e.target.value, f)}
                                                disabled={updatingEstados[f.id]}
                                                className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                                            >
                                                <option value="emitida">Emitida</option>
                                                <option value="enviada">Enviada</option>
                                                <option value="pendiente">Pendiente</option>
                                                <option value="pagada">Pagada</option>
                                                <option value="cancelada">Cancelada</option>
                                                <option value="vencida">Vencida</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openDetailModal(f)} className="text-slate-400 hover:text-white transition-colors">
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-xl font-bold text-white">
                                {viewingFactura ? `Factura ${viewingFactura.numero}` : 'Nueva Factura'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>

                        {viewingFactura ? (
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-slate-400 text-sm">Cliente</p>
                                        <p className="text-white text-xl font-bold">{viewingFactura.cliente.razonSocial}</p>
                                    </div>
                                    <div className="text-right space-y-2">
                                        <div>
                                            <p className="text-slate-400 text-sm mb-2">Estado</p>
                                            <select
                                                value={tempEstado || viewingFactura.estado}
                                                onChange={(e) => {
                                                    const nuevoEstado = e.target.value;
                                                    handleUpdateEstado(viewingFactura.id, nuevoEstado, viewingFactura);
                                                }}
                                                disabled={updatingEstado}
                                                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
                                            >
                                                <option value="emitida">Emitida</option>
                                                <option value="enviada">Enviada</option>
                                                <option value="pendiente">Pendiente</option>
                                                <option value="pagada">Pagada</option>
                                                <option value="cancelada">Cancelada</option>
                                                <option value="vencida">Vencida</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                    <div>
                                        <label className="text-slate-500 text-xs uppercase font-bold">Fecha Emisión</label>
                                        <p className="text-slate-300">{new Date(viewingFactura.fechaEmision).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs uppercase font-bold">Fecha Vencimiento</label>
                                        <p className="text-slate-300">{new Date(viewingFactura.fechaVenc).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs uppercase font-bold">Folio Interno</label>
                                        <p className="text-slate-300 font-mono">{viewingFactura.numero}</p>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs uppercase font-bold mb-1 block">N° Factura SII</label>
                                        <div className="flex gap-1.5 items-center">
                                            <input
                                                type="text"
                                                value={tempNumeroSII !== null ? tempNumeroSII : (viewingFactura.numeroSII || '')}
                                                onChange={(e) => {
                                                    setTempNumeroSII(e.target.value);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleSaveNumeroSII();
                                                    }
                                                }}
                                                placeholder="Ingresar número SII"
                                                className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none max-w-[140px]"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSaveNumeroSII}
                                                disabled={savingNumeroSII || (tempNumeroSII !== null ? tempNumeroSII : (viewingFactura.numeroSII || '')) === (viewingFactura.numeroSII || '')}
                                                className="p-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded transition-colors"
                                                title="Guardar número SII"
                                            >
                                                {savingNumeroSII ? (
                                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-white font-semibold mb-4 border-b border-slate-700/50 pb-2">Ítems</h3>
                                    <div className="space-y-3">
                                        {viewingFactura.items.map((item, i) => (
                                            <div key={i} className="flex justify-between py-2 border-b border-slate-800 text-sm">
                                                <div className="flex-1">
                                                    <p className="text-slate-200">{item.descripcion}</p>
                                                    <p className="text-slate-500 text-xs">{item.cantidad} x {formatPrice(item.precioUnit)}</p>
                                                </div>
                                                <p className="text-slate-200 font-mono">{formatPrice(item.total || item.cantidad * item.precioUnit)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
                                        <div className="flex justify-between text-slate-300">
                                            <span>Subtotal:</span>
                                            <span className="font-mono">{formatPrice(viewingFactura.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>IVA (19%):</span>
                                            <span className="font-mono">{formatPrice(viewingFactura.impuesto)}</span>
                                        </div>
                                        <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-slate-700">
                                            <span>TOTAL:</span>
                                            <span className="text-emerald-400">{formatPrice(viewingFactura.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => handleDownloadPDF(viewingFactura.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Descargar PDF
                                    </button>
                                    <button
                                        onClick={() => handleSendEmail(viewingFactura.id)}
                                        disabled={sendingEmail}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Cliente</label>
                                        <select
                                            required
                                            value={formData.clienteId}
                                            onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        >
                                            <option value="">Seleccionar Cliente</option>
                                            {clientes.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Folio Interno</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.numero}
                                            onChange={e => setFormData({ ...formData, numero: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">N° Factura SII (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.numeroSII}
                                            onChange={e => setFormData({ ...formData, numeroSII: e.target.value })}
                                            placeholder="Ingresar número SII"
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Fecha Emisión</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fechaEmision}
                                            onChange={e => setFormData({ ...formData, fechaEmision: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Fecha Vencimiento</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fechaVenc}
                                            onChange={e => setFormData({ ...formData, fechaVenc: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-white font-medium">Ítems</h3>
                                        <button type="button" onClick={addItem} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                                            + Agregar Ítem
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-start">
                                                <input
                                                    type="text"
                                                    placeholder="Descripción"
                                                    value={item.descripcion}
                                                    onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                                                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Cant."
                                                    value={item.cantidad}
                                                    onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))}
                                                    className="w-20 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                    min="1"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Precio"
                                                    value={item.precioUnit}
                                                    onChange={e => updateItem(idx, 'precioUnit', Number(e.target.value))}
                                                    className="w-32 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                    min="0"
                                                    required
                                                />
                                                <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.aplicarIVA}
                                                onChange={(e) => setFormData({ ...formData, aplicarIVA: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                                            />
                                            <span className="text-sm">Aplicar IVA (19%)</span>
                                        </label>
                                        <div className="flex justify-end items-start gap-8 text-white pt-2">
                                            <div className="text-right space-y-1">
                                                <div className="flex justify-between gap-4 text-slate-400 text-sm">
                                                    <span>Subtotal:</span>
                                                    <span className="font-mono">{formatPrice(calculateSubtotal(formData.items))}</span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-slate-400 text-sm">
                                                    <span>IVA (19%):</span>
                                                    <span className="font-mono">{formatPrice(calculateIVA(calculateSubtotal(formData.items), formData.aplicarIVA))}</span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-xl font-bold pt-1 border-t border-slate-700">
                                                    <span>Total:</span>
                                                    <span className="text-emerald-400">{formatPrice(calculateSubtotal(formData.items) + calculateIVA(calculateSubtotal(formData.items), formData.aplicarIVA))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={closeModal} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-colors">Cancelar</button>
                                    <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                                        {saving ? 'Guardando...' : 'Crear Factura'}
                                    </button>
                                </div>
                            </form>
                        )}
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
                onCancelCallback={confirmDialog.onCancel}
            />
        </div>
    );
}
