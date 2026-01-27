'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Gasto {
    id: string;
    monto: number;
    motivo: string;
    categoria: string;
    fecha: string;
    proveedor: string | null;
    comprobante: string | null;
    notas: string | null;
    createdAt: string;
    updatedAt: string;
}

const categorias = [
    { value: 'servicios', label: 'Servicios' },
    { value: 'insumos', label: 'Insumos' },
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'otros', label: 'Otros' },
];

export default function GastosPage() {
    const toast = useToast();
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingGasto, setViewingGasto] = useState<Gasto | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
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

    const [formData, setFormData] = useState({
        monto: '',
        motivo: '',
        categoria: 'otros',
        fecha: new Date().toISOString().split('T')[0],
        proveedor: '',
        notas: '',
        comprobante: null as string | null,
    });

    const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
    const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/gastos');
            if (res.ok) {
                const data = await res.json();
                setGastos(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setComprobanteFile(file);
            // Crear preview para imágenes
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setComprobantePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setComprobantePreview(null);
            }
        }
    };

    const uploadComprobante = async (): Promise<string | null> => {
        if (!comprobanteFile) return formData.comprobante;

        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', comprobanteFile);

            const res = await fetch('/api/gastos/upload', {
                method: 'POST',
                body: uploadFormData,
            });

            if (res.ok) {
                const data = await res.json();
                return data.path;
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Error al subir comprobante');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al subir comprobante');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Subir comprobante si hay uno nuevo
            let comprobantePath = formData.comprobante;
            if (comprobanteFile) {
                const uploadedPath = await uploadComprobante();
                if (!uploadedPath) {
                    setSaving(false);
                    return;
                }
                comprobantePath = uploadedPath;
            }

            const payload = {
                monto: parseFloat(formData.monto),
                motivo: formData.motivo,
                categoria: formData.categoria,
                fecha: formData.fecha,
                proveedor: formData.proveedor || null,
                notas: formData.notas || null,
                comprobante: comprobantePath,
            };

            if (viewingGasto) {
                // Actualizar
                const res = await fetch(`/api/gastos/${viewingGasto.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...payload,
                        comprobanteAnterior: viewingGasto.comprobante,
                    }),
                });

                if (res.ok) {
                    toast.success('Gasto actualizado');
                    closeModal();
                    fetchData();
                } else {
                    const error = await res.json();
                    toast.error(error.error || 'Error al actualizar gasto');
                }
            } else {
                // Crear
                const res = await fetch('/api/gastos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    toast.success('Gasto registrado');
                    closeModal();
                    fetchData();
                } else {
                    const error = await res.json();
                    toast.error(error.error || 'Error al registrar gasto');
                }
            }
        } catch (error: any) {
            toast.error('Error al guardar gasto');
        } finally {
            setSaving(false);
        }
    };

    const openNewModal = () => {
        setFormData({
            monto: '',
            motivo: '',
            categoria: 'otros',
            fecha: new Date().toISOString().split('T')[0],
            proveedor: '',
            notas: '',
            comprobante: null,
        });
        setComprobanteFile(null);
        setComprobantePreview(null);
        setViewingGasto(null);
        setShowModal(true);
    };

    const openDetailModal = (gasto: Gasto) => {
        setViewingGasto(gasto);
        setFormData({
            monto: gasto.monto.toString(),
            motivo: gasto.motivo,
            categoria: gasto.categoria,
            fecha: new Date(gasto.fecha).toISOString().split('T')[0],
            proveedor: gasto.proveedor || '',
            notas: gasto.notas || '',
            comprobante: gasto.comprobante,
        });
        setComprobanteFile(null);
        setComprobantePreview(gasto.comprobante || null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setViewingGasto(null);
        setComprobanteFile(null);
        setComprobantePreview(null);
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Gasto',
            message: '¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                try {
                    const res = await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        toast.success('Gasto eliminado');
                        fetchData();
                    } else {
                        const error = await res.json();
                        toast.error(error.error || 'Error al eliminar gasto');
                    }
                } catch (error) {
                    toast.error('Error al eliminar gasto');
                }
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
    };

    const getCategoriaLabel = (categoria: string) => {
        return categorias.find(c => c.value === categoria)?.label || categoria;
    };

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gastos</h1>
                    <p className="text-slate-400 mt-1">Registro de gastos y pagos a proveedores</p>
                </div>
                <button
                    onClick={openNewModal}
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                    + Nuevo Gasto
                </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Total Gastos</p>
                    <p className="text-2xl font-bold text-white mt-2">{formatPrice(totalGastos)}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Total Registros</p>
                    <p className="text-2xl font-bold text-white mt-2">{gastos.length}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Promedio por Gasto</p>
                    <p className="text-2xl font-bold text-white mt-2">
                        {gastos.length > 0 ? formatPrice(totalGastos / gastos.length) : formatPrice(0)}
                    </p>
                </div>
            </div>

            {/* Lista de gastos */}
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Motivo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase">Monto</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-400 uppercase">Comprobante</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-400 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {gastos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No hay gastos registrados
                                    </td>
                                </tr>
                            ) : (
                                gastos.map((gasto) => (
                                    <tr key={gasto.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            {new Date(gasto.fecha).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white font-medium">{gasto.motivo}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">
                                                {getCategoriaLabel(gasto.categoria)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-300">{gasto.proveedor || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-white">
                                            {formatPrice(gasto.monto)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {gasto.comprobante ? (
                                                <a
                                                    href={gasto.comprobante}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:text-cyan-300"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </a>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => openDetailModal(gasto)}
                                                    className="text-cyan-400 hover:text-cyan-300"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(gasto.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-xl font-bold text-white">
                                {viewingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Monto *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={formData.monto}
                                        onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Fecha *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Motivo *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.motivo}
                                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="Descripción del gasto"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Categoría *</label>
                                    <select
                                        required
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        {categorias.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Proveedor</label>
                                    <input
                                        type="text"
                                        value={formData.proveedor}
                                        onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        placeholder="Nombre del proveedor"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Comprobante</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
                                />
                                {comprobantePreview && (
                                    <div className="mt-4">
                                        {comprobantePreview.startsWith('data:') || comprobantePreview.startsWith('/') ? (
                                            comprobantePreview.startsWith('data:') ? (
                                                <img src={comprobantePreview} alt="Preview" className="max-w-full h-48 object-contain rounded-lg border border-slate-600" />
                                            ) : (
                                                <a href={comprobantePreview} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                                                    Ver comprobante actual
                                                </a>
                                            )
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Notas</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    rows={3}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="Notas adicionales"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving || uploading} className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50">
                                    {saving || uploading ? 'Guardando...' : viewingGasto ? 'Actualizar' : 'Registrar Gasto'}
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
}
