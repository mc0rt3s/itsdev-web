'use client';

import { useState, useEffect } from 'react';

interface Cotizacion {
    id: string;
    numero: string;
    cliente?: { razonSocial: string; email?: string | null };
    clienteId?: string;
    nombreProspecto?: string;
    emailProspecto?: string;
    fecha: string;
    validez: string;
    estado: string;
    subtotal: number;
    descuento?: number;
    impuesto: number;
    total: number;
    items: ItemCotizacion[];
}

interface ItemCotizacion {
    sku?: string;
    descripcion: string;
    cantidad: number;
    precioCompraUSD?: number;
    precioCompraCLP?: number;
    margenPorcentaje?: number;
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
    const [destinatarioEmail, setDestinatarioEmail] = useState('');

    // Use a string 'prospecto' or 'cliente' to toggle form mode
    const [targetType, setTargetType] = useState<'cliente' | 'prospecto'>('cliente');

    const [valores, setValores] = useState<{ tipoCambioUSD: number }>({ tipoCambioUSD: 924 });
    const [formData, setFormData] = useState({
        clienteId: '',
        nombreProspecto: '',
        emailProspecto: '',
        numero: '',
        fecha: new Date().toISOString().split('T')[0],
        validez: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estado: 'borrador',
        descuento: 0,
        tipoCambioUSD: 924,
        modoEnvio: 'Entrega en oficina de cliente',
        fechaEntrega: '24 Hrs posteriores confirmado el pago',
        formaPago: 'Transferencia',
        duracionValidezDias: 14,
        items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }] as ItemCotizacion[],
        notas: '',
        aplicarIVA: true
    });
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        fetchData();
        fetchValores();
    }, []);

    const fetchValores = async () => {
        try {
            const res = await fetch('/api/config/valores');
            if (res.ok) {
                const data = await res.json();
                setValores({ tipoCambioUSD: data.tipoCambioUSD ?? 924 });
            }
        } catch {
            setValores({ tipoCambioUSD: 924 });
        }
    };

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
        setTargetType('cliente');
        setFormData({
            clienteId: '',
            nombreProspecto: '',
            emailProspecto: '',
            numero: `COT-${new Date().getFullYear()}-${String(cotizaciones.length + 1).padStart(3, '0')}`,
            fecha: new Date().toISOString().split('T')[0],
            validez: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estado: 'borrador',
            descuento: 0,
            tipoCambioUSD: valores.tipoCambioUSD,
            modoEnvio: 'Entrega en oficina de cliente',
            fechaEntrega: '24 Hrs posteriores confirmado el pago',
            formaPago: 'Transferencia',
            duracionValidezDias: 14,
            items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
            notas: '',
            aplicarIVA: true
        });
        setShowModal(true);
    };

    const openDetailModal = (cot: Cotizacion) => {
        setViewingCotizacion(cot);
        setDestinatarioEmail(cot.cliente?.email || cot.emailProspecto || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setViewingCotizacion(null);
        setDestinatarioEmail('');
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { descripcion: '', cantidad: 1, precioUnit: 0 }]
        });
    };

    // Precio venta = Precio compra / (1 - % ganancia)  →  PC / (1 - %G/100)
    const calcPrecioConMargen = (costoCLP: number, margenPct: number): number => {
        if (margenPct <= 0) return costoCLP;
        if (margenPct >= 100) return costoCLP;
        return Math.round(costoCLP / (1 - margenPct / 100));
    };

    const updateItem = (index: number, field: keyof ItemCotizacion, value: string | number) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index], [field]: value };

        // Auto-calc: costo USD (decimal) * tipo cambio → costo CLP (entero); costo CLP / (1 - %G) → precioUnit
        if (field === 'precioCompraUSD' && typeof value === 'number') {
            if (value > 0) {
                item.precioCompraCLP = Math.round(value * formData.tipoCambioUSD); // CLP sin decimales
                if (item.margenPorcentaje != null && item.margenPorcentaje > 0 && item.margenPorcentaje < 100) {
                    item.precioUnit = calcPrecioConMargen(item.precioCompraCLP || 0, item.margenPorcentaje);
                }
            } else {
                item.precioCompraCLP = undefined;
            }
        }
        if (field === 'precioCompraCLP' && typeof value === 'number') {
            const costoCLP = Math.round(value); // CLP siempre entero
            item.precioCompraCLP = costoCLP > 0 ? costoCLP : undefined;
            if (costoCLP > 0 && item.margenPorcentaje != null && item.margenPorcentaje > 0 && item.margenPorcentaje < 100) {
                item.precioUnit = calcPrecioConMargen(costoCLP, item.margenPorcentaje);
            }
        }
        if (field === 'margenPorcentaje' && typeof value === 'number') {
            const costo = item.precioCompraCLP ?? (item.precioCompraUSD != null && item.precioCompraUSD > 0 ? Math.round(item.precioCompraUSD * formData.tipoCambioUSD) : 0);
            if (costo > 0 && value > 0 && value < 100) {
                item.precioUnit = calcPrecioConMargen(costo, value);
            }
        }
        if (field === 'precioUnit' && typeof value === 'number') {
            item.precioUnit = Math.round(value); // CLP sin decimales
        }

        newItems[index] = item;
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

    const calculateIVA = (subtotal: number, aplicar: boolean, descuento = 0) => {
        const base = Math.max(0, subtotal - descuento);
        return aplicar ? Math.round(base * 0.19) : 0;
    };

    const calculateTotal = () => {
        const sub = calculateSubtotal(formData.items);
        const desc = formData.descuento || 0;
        const iva = calculateIVA(sub, formData.aplicarIVA, desc);
        return Math.max(0, sub - desc) + iva;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);

        // Leer valores del DOM para evitar condición de carrera (state desactualizado al submit rápido)
        const form = e.currentTarget;
        const selectCliente = form.querySelector<HTMLSelectElement>('select[name="clienteId"]');
        const inputNombre = form.querySelector<HTMLInputElement>('input[name="nombreProspecto"]');
        const inputEmail = form.querySelector<HTMLInputElement>('input[name="emailProspecto"]');
        const clienteIdActual = selectCliente?.value?.trim() || null;
        const nombreProspectoActual = inputNombre?.value?.trim() || null;
        const emailProspectoActual = inputEmail?.value?.trim() || null;

        const payload = {
            ...formData,
            clienteId: targetType === 'cliente' ? clienteIdActual : null,
            nombreProspecto: targetType === 'prospecto' ? nombreProspectoActual : null,
            emailProspecto: targetType === 'prospecto' ? emailProspectoActual : null,
            items: formData.items.map(({ descripcion, sku, cantidad, precioCompraUSD, precioCompraCLP, margenPorcentaje, precioUnit }) => ({
                descripcion,
                sku: sku || null,
                cantidad,
                precioCompraUSD: precioCompraUSD ?? null,
                precioCompraCLP: precioCompraCLP ?? null,
                margenPorcentaje: margenPorcentaje ?? null,
                precioUnit
            })),
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
        try {
            const res = await fetch(`/api/cotizaciones/${id}/pdf`);
            if (!res.ok) {
                const payload = await res.json().catch(() => ({ error: 'Error al generar PDF' }));
                alert(payload.error || 'Error al generar PDF');
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch {
            alert('Error al generar PDF');
        }
    };

    const handleSendEmail = async (id: string) => {
        if (!confirm('¿Enviar cotización por email?')) return;
        if (!destinatarioEmail.trim()) {
            alert('Debes indicar un email de destino');
            return;
        }

        setSendingEmail(true);
        try {
            const res = await fetch(`/api/cotizaciones/${id}/enviar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinatario: destinatarioEmail.trim() })
            });
            if (res.ok) {
                const payload = await res.json();
                alert(`Cotización enviada exitosamente a ${payload.destinatario || destinatarioEmail.trim()}`);
                fetchData();
                const detailRes = await fetch(`/api/cotizaciones/${id}`);
                if (detailRes.ok) {
                    setViewingCotizacion(await detailRes.json());
                }
            } else {
                const error = await res.json();
                alert(error.error || 'Error al enviar');
            }
        } catch {
            alert('Error al enviar cotización');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleUpdateEstado = async (id: string, estado: string) => {
        try {
            const res = await fetch(`/api/cotizaciones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado })
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({ error: 'Error al actualizar estado' }));
                alert(payload.error || 'Error al actualizar estado');
                return;
            }

            const updated = await res.json();
            setViewingCotizacion((prev) => (prev ? { ...prev, estado: updated.estado } : prev));
            fetchData();
        } catch {
            alert('Error al actualizar estado');
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
                                        {(viewingCotizacion.cliente?.email || viewingCotizacion.emailProspecto) && (
                                            <p className="text-sm text-slate-500">
                                                {viewingCotizacion.cliente?.email || viewingCotizacion.emailProspecto}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-sm">Estado</p>
                                        <span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full border capitalize ${getStatusBadge(viewingCotizacion.estado)}`}>
                                            {viewingCotizacion.estado}
                                        </span>
                                        <div className="mt-2 flex items-center gap-2">
                                            <select
                                                value={viewingCotizacion.estado}
                                                onChange={(e) => handleUpdateEstado(viewingCotizacion.id, e.target.value)}
                                                className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white"
                                            >
                                                <option value="borrador">Borrador</option>
                                                <option value="enviada">Enviada</option>
                                                <option value="aprobada">Aprobada</option>
                                                <option value="rechazada">Rechazada</option>
                                                <option value="vencida">Vencida</option>
                                            </select>
                                        </div>
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
                                                    <p className="text-slate-200">
                                                        {item.sku && <span className="text-slate-500 font-mono mr-2">[{item.sku}]</span>}
                                                        {item.descripcion}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">{item.cantidad} x {formatPrice(item.precioUnit)}</p>
                                                </div>
                                                <p className="text-slate-200 font-mono">{formatPrice(item.total ?? item.cantidad * item.precioUnit)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
                                        <div className="flex justify-between text-slate-300">
                                            <span>Subtotal:</span>
                                            <span className="font-mono">{formatPrice(viewingCotizacion.subtotal)}</span>
                                        </div>
                                        {viewingCotizacion.descuento && viewingCotizacion.descuento > 0 && (
                                            <div className="flex justify-between text-slate-300">
                                                <span>Descuento:</span>
                                                <span className="font-mono">-{formatPrice(viewingCotizacion.descuento)}</span>
                                            </div>
                                        )}
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
                                <div className="pt-1">
                                    <label className="block text-sm text-slate-400 mb-1">Enviar a</label>
                                    <input
                                        type="email"
                                        value={destinatarioEmail}
                                        onChange={(e) => setDestinatarioEmail(e.target.value)}
                                        placeholder="correo@cliente.com"
                                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    />
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
                                                name="clienteId"
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
                                                    name="nombreProspecto"
                                                    type="text"
                                                    placeholder="Nombre Prospecto"
                                                    required
                                                    value={formData.nombreProspecto}
                                                    onChange={e => setFormData({ ...formData, nombreProspecto: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                                />
                                                <input
                                                    name="emailProspecto"
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
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Tipo cambio US$</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.tipoCambioUSD}
                                            onChange={e => setFormData({ ...formData, tipoCambioUSD: Number(e.target.value) || 924 })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                            placeholder="924"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Modo envío</label>
                                        <input type="text" value={formData.modoEnvio} onChange={e => setFormData({ ...formData, modoEnvio: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white" placeholder="Entrega oficina" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Fecha entrega</label>
                                        <input type="text" value={formData.fechaEntrega} onChange={e => setFormData({ ...formData, fechaEntrega: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white" placeholder="24 Hrs post pago" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Forma pago</label>
                                        <input type="text" value={formData.formaPago} onChange={e => setFormData({ ...formData, formaPago: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white" placeholder="Transferencia" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Validez (días)</label>
                                        <input type="number" min="1" value={formData.duracionValidezDias} onChange={e => setFormData({ ...formData, duracionValidezDias: Number(e.target.value) || 14 })} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white" />
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
                                    <p className="text-xs text-slate-500 mb-3">Costo: USD (con decimal) o CLP (entero). Precio venta = Costo / (1 - % ganancia). El descuento global se aplica al total.</p>
                                    <div className="space-y-3">
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2">
                                                <div className="flex gap-2 flex-wrap items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="SKU"
                                                        value={item.sku || ''}
                                                        onChange={e => updateItem(idx, 'sku', e.target.value)}
                                                        className="w-20 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Descripción *"
                                                        value={item.descripcion}
                                                        onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                                                        className="flex-1 min-w-[160px] bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                        required
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Cant."
                                                        value={item.cantidad}
                                                        onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))}
                                                        className="w-16 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                        min="1"
                                                        required
                                                    />
                                                    <span className="text-slate-500 text-xs">Costo:</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="USD (con decimal)"
                                                        value={item.precioCompraUSD ?? ''}
                                                        onChange={e => updateItem(idx, 'precioCompraUSD', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                                        className="w-24 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                        min="0"
                                                    />
                                                    <span className="text-slate-500 text-xs">o</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        placeholder="CLP (entero)"
                                                        value={item.precioCompraCLP ?? ''}
                                                        onChange={e => updateItem(idx, 'precioCompraCLP', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                                                        className="w-24 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                        min="0"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="% ganancia"
                                                        value={item.margenPorcentaje ?? ''}
                                                        onChange={e => updateItem(idx, 'margenPorcentaje', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                                        className="w-20 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                        min="0"
                                                        max="99.9"
                                                    />
                                                    <span className="text-slate-500 text-xs">→</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        placeholder="Precio venta CLP *"
                                                        value={item.precioUnit}
                                                        onChange={e => updateItem(idx, 'precioUnit', parseInt(e.target.value, 10) || 0)}
                                                        className="w-28 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white font-mono"
                                                        min="0"
                                                        required
                                                    />
                                                    <span className="text-slate-400 text-sm font-mono">= {formatPrice((item.total ?? item.cantidad * item.precioUnit))}</span>
                                                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex gap-4 items-center">
                                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.aplicarIVA}
                                                    onChange={(e) => setFormData({ ...formData, aplicarIVA: e.target.checked })}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                                                />
                                                <span className="text-sm">Aplicar IVA (19%)</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-slate-400">Descuento:</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.descuento}
                                                    onChange={e => setFormData({ ...formData, descuento: Number(e.target.value) || 0 })}
                                                    className="w-24 bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-start gap-8 text-white pt-2">
                                            <div className="text-right space-y-1">
                                                <div className="flex justify-between gap-4 text-slate-400 text-sm">
                                                    <span>Subtotal:</span>
                                                    <span className="font-mono">{formatPrice(calculateSubtotal(formData.items))}</span>
                                                </div>
                                                {formData.descuento > 0 && (
                                                    <div className="flex justify-between gap-4 text-slate-400 text-sm">
                                                        <span>Descuento:</span>
                                                        <span className="font-mono">-{formatPrice(formData.descuento)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between gap-4 text-slate-400 text-sm">
                                                    <span>IVA (19%):</span>
                                                    <span className="font-mono">{formatPrice(calculateIVA(calculateSubtotal(formData.items), formData.aplicarIVA, formData.descuento))}</span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-xl font-bold pt-1 border-t border-slate-700">
                                                    <span>Total:</span>
                                                    <span className="text-emerald-400">{formatPrice(calculateTotal())}</span>
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
