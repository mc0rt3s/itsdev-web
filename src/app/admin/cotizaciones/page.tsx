'use client';

import { useState, useEffect } from 'react';

interface Cotizacion {
    id: string;
    numero: string;
    cliente?: { razonSocial: string };
    clienteId?: string;
    nombreProspecto?: string;
    emailProspecto?: string;
    fecha: string;
    validez: string;
    estado: string;
    subtotal: number;
    impuesto: number;
    total: number;
    items: ItemCotizacion[];
}

interface ItemCotizacion {
    descripcion: string;
    cantidad: number;
    precioUnit: number;
    total?: number;
}

interface Cliente {
    id: string;
    razonSocial: string;
}

export default function CotizacionesPage() {
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingCotizacion, setViewingCotizacion] = useState<Cotizacion | null>(null);

    // Use a string 'prospecto' or 'cliente' to toggle form mode
    const [targetType, setTargetType] = useState<'cliente' | 'prospecto'>('cliente');

    const [formData, setFormData] = useState({
        clienteId: '',
        nombreProspecto: '',
        emailProspecto: '',
        numero: '',
        fecha: new Date().toISOString().split('T')[0],
        validez: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estado: 'borrador',
        items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
        notas: '',
        aplicarIVA: true
    });
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [cotsRes, clientesRes] = await Promise.all([
                fetch('/api/cotizaciones'),
                fetch('/api/clientes')
            ]);
            if (cotsRes.ok) setCotizaciones(await cotsRes.json());
            if (clientesRes.ok) setClientes(await clientesRes.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openNewModal = () => {
        setViewingCotizacion(null);
        setFormData({
            clienteId: '',
            nombreProspecto: '',
            emailProspecto: '',
            numero: `COT-${new Date().getFullYear()}-${String(cotizaciones.length + 1).padStart(3, '0')}`,
            fecha: new Date().toISOString().split('T')[0],
            validez: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estado: 'borrador',
            items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
            notas: '',
            aplicarIVA: true
        });
        setShowModal(true);
    };

    const openDetailModal = (cot: Cotizacion) => {
        setViewingCotizacion(cot);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setViewingCotizacion(null);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { descripcion: '', cantidad: 1, precioUnit: 0 }]
        });
    };

    const updateItem = (index: number, field: keyof ItemCotizacion, value: string | number) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateSubtotal = (items: ItemCotizacion[]) => {
        return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnit), 0);
    };

    const calculateIVA = (subtotal: number, aplicar: boolean) => {
        return aplicar ? Math.round(subtotal * 0.19) : 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            ...formData,
            clienteId: targetType === 'cliente' ? formData.clienteId : null,
            nombreProspecto: targetType === 'prospecto' ? formData.nombreProspecto : null,
            emailProspecto: targetType === 'prospecto' ? formData.emailProspecto : null,
        };

        try {
            const res = await fetch('/api/cotizaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                closeModal();
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al crear cotización');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async (id: string) => {
        window.open(`/api/cotizaciones/${id}/pdf`, '_blank');
    };

    const handleSendEmail = async (id: string) => {
        if (!confirm('¿Enviar cotización por email?')) return;
        setSendingEmail(true);
        try {
            const res = await fetch(`/api/cotizaciones/${id}/enviar`, { method: 'POST' });
            if (res.ok) {
                alert('Cotización enviada exitosamente');
                fetchData();
            } else {
                const error = await res.json();
                alert(error.error || 'Error al enviar');
            }
        } catch (error) {
            alert('Error al enviar cotización');
        } finally {
            setSendingEmail(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            aprobada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            enviada: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            borrador: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
            rechazada: 'bg-red-500/20 text-red-400 border-red-500/30',
            vencida: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
        return styles[status] || styles.borrador;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Cotizaciones</h1>
                    <p className="text-slate-400 mt-1">Propuestas comerciales</p>
                </div>
                <button onClick={openNewModal} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Nueva Cotización
                </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center text-slate-400">Cargando...</div>
                ) : cotizaciones.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">No hay cotizaciones registradas.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50 text-left">
                                    <th className="p-4 text-slate-300">Folio</th>
                                    <th className="p-4 text-slate-300">Cliente / Prospecto</th>
                                    <th className="p-4 text-slate-300">Fecha</th>
                                    <th className="p-4 text-slate-300">Validez</th>
                                    <th className="p-4 text-slate-300">Total</th>
                                    <th className="p-4 text-slate-300">Estado</th>
                                    <th className="p-4 text-slate-300 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cotizaciones.map(c => (
                                    <tr key={c.id} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                                        <td className="p-4 font-mono text-cyan-400">{c.numero}</td>
                                        <td className="p-4 text-white font-medium">
                                            {c.cliente ? c.cliente.razonSocial : (
                                                <span className="flex items-center gap-1">
                                                    {c.nombreProspecto} <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Prospecto</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-400">{new Date(c.fecha).toLocaleDateString('es-CL')}</td>
                                        <td className="p-4 text-slate-400">{new Date(c.validez).toLocaleDateString('es-CL')}</td>
                                        <td className="p-4 text-white font-bold">{formatPrice(c.total)}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border border-dashed capitalize ${getStatusBadge(c.estado)}`}>
                                                {c.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openDetailModal(c)} className="text-slate-400 hover:text-white transition-colors">
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-xl font-bold text-white">
                                {viewingCotizacion ? `Cotización ${viewingCotizacion.numero}` : 'Nueva Cotización'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>

                        {viewingCotizacion ? (
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-slate-400 text-sm">Cliente / Prospecto</p>
                                        <p className="text-white text-xl font-bold">
                                            {viewingCotizacion.cliente ? viewingCotizacion.cliente.razonSocial : viewingCotizacion.nombreProspecto}
                                        </p>
                                        {viewingCotizacion.emailProspecto && <p className="text-sm text-slate-500">{viewingCotizacion.emailProspecto}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-sm">Estado</p>
                                        <span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full border capitalize ${getStatusBadge(viewingCotizacion.estado)}`}>
                                            {viewingCotizacion.estado}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                    <div>
                                        <label className="text-slate-500 text-xs uppercase font-bold">Fecha</label>
                                        <p className="text-slate-300">{new Date(viewingCotizacion.fecha).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs uppercase font-bold">Válida hasta</label>
                                        <p className="text-slate-300">{new Date(viewingCotizacion.validez).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs uppercase font-bold">Folio</label>
                                        <p className="text-slate-300">{viewingCotizacion.numero}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-white font-semibold mb-4 border-b border-slate-700/50 pb-2">Ítems</h3>
                                    <div className="space-y-3">
                                        {viewingCotizacion.items.map((item, i) => (
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
                                            <span className="font-mono">{formatPrice(viewingCotizacion.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>IVA (19%):</span>
                                            <span className="font-mono">{formatPrice(viewingCotizacion.impuesto)}</span>
                                        </div>
                                        <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-slate-700">
                                            <span>TOTAL:</span>
                                            <span className="text-emerald-400">{formatPrice(viewingCotizacion.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => handleDownloadPDF(viewingCotizacion.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Descargar PDF
                                    </button>
                                    <button
                                        onClick={() => handleSendEmail(viewingCotizacion.id)}
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
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Destinatario</label>
                                        <div className="flex bg-slate-900 rounded-lg p-1 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setTargetType('cliente')}
                                                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${targetType === 'cliente' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Cliente Existente
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTargetType('prospecto')}
                                                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${targetType === 'prospecto' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Prospecto
                                            </button>
                                        </div>

                                        {targetType === 'cliente' ? (
                                            <select
                                                required
                                                value={formData.clienteId}
                                                onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                            >
                                                <option value="">Seleccionar Cliente</option>
                                                {clientes.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                                            </select>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre Prospecto"
                                                    required
                                                    value={formData.nombreProspecto}
                                                    onChange={e => setFormData({ ...formData, nombreProspecto: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email Prospecto"
                                                    value={formData.emailProspecto}
                                                    onChange={e => setFormData({ ...formData, emailProspecto: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Folio Int.</label>
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
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Fecha</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fecha}
                                            onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Válida hasta</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.validez}
                                            onChange={e => setFormData({ ...formData, validez: e.target.value })}
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
                                        {saving ? 'Guardando...' : 'Crear Cotización'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
