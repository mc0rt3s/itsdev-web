'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

interface Cliente {
  id: string;
  razonSocial: string;
  rut: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
}

interface Acceso {
  id: string;
  nombre: string;
  tipo: string;
  url: string | null;
  puerto: string | null;
  usuario: string | null;
  password: string | null;
  notas: string | null;
  clienteId: string | null;
  cliente: Cliente | null;
  createdAt: string;
  updatedAt: string;
}

const tiposAcceso = [
  { value: 'hosting', label: 'Hosting', icon: '🌐', color: 'cyan' },
  { value: 'cpanel', label: 'cPanel', icon: '⚙️', color: 'orange' },
  { value: 'email', label: 'Email', icon: '📧', color: 'blue' },
  { value: 'ftp', label: 'FTP', icon: '📁', color: 'yellow' },
  { value: 'ssh', label: 'SSH', icon: '💻', color: 'green' },
  { value: 'db', label: 'Base de Datos', icon: '🗄️', color: 'purple' },
  { value: 'vpn', label: 'VPN', icon: '🔒', color: 'red' },
  { value: 'cloud', label: 'Cloud', icon: '☁️', color: 'sky' },
  { value: 'otro', label: 'Otro', icon: '📌', color: 'slate' },
];

const tipoColors: Record<string, string> = {
  hosting: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  cpanel: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ftp: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ssh: 'bg-green-500/20 text-green-400 border-green-500/30',
  db: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  vpn: 'bg-red-500/20 text-red-400 border-red-500/30',
  cloud: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  otro: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const tipoLabels: Record<string, string> = {
  hosting: 'Hosting',
  cpanel: 'cPanel',
  email: 'Email',
  ftp: 'FTP',
  ssh: 'SSH',
  db: 'Base de Datos',
  vpn: 'VPN',
  cloud: 'Cloud',
  otro: 'Otro',
};

export default function AccesosPage() {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInformeModal, setShowInformeModal] = useState(false);
  const [editingAcceso, setEditingAcceso] = useState<Acceso | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'hosting',
    url: '',
    puerto: '',
    usuario: '',
    password: '',
    notas: '',
    clienteId: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados para el modal de informe
  const [informeClienteId, setInformeClienteId] = useState('');
  const [informeDestinatario, setInformeDestinatario] = useState('');
  const [informeAsunto, setInformeAsunto] = useState('');
  const [informeMensaje, setInformeMensaje] = useState('');
  const [enviandoInforme, setEnviandoInforme] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [informeError, setInformeError] = useState('');
  const [informeSuccess, setInformeSuccess] = useState('');

  useEffect(() => {
    fetchAccesos();
    fetchClientes();
  }, []);

  const fetchAccesos = async () => {
    try {
      const res = await fetch('/api/accesos');
      if (res.ok) {
        const data = await res.json();
        setAccesos(data);
      }
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const openModal = (acceso?: Acceso) => {
    if (acceso) {
      setEditingAcceso(acceso);
      setFormData({
        nombre: acceso.nombre,
        tipo: acceso.tipo,
        url: acceso.url || '',
        puerto: acceso.puerto || '',
        usuario: acceso.usuario || '',
        password: acceso.password || '',
        notas: acceso.notas || '',
        clienteId: acceso.clienteId || '',
      });
    } else {
      setEditingAcceso(null);
      setFormData({
        nombre: '',
        tipo: 'hosting',
        url: '',
        puerto: '',
        usuario: '',
        password: '',
        notas: '',
        clienteId: '',
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAcceso(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const url = editingAcceso ? `/api/accesos/${editingAcceso.id}` : '/api/accesos';
      const method = editingAcceso ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeModal();
        fetchAccesos();
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
    if (!confirm('¿Estás seguro de eliminar este acceso?')) return;

    try {
      const res = await fetch(`/api/accesos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAccesos();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAccesos = accesos.filter((a) => {
    const matchesSearch =
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cliente?.razonSocial.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = !filterCliente || a.clienteId === filterCliente;
    const matchesTipo = !filterTipo || a.tipo === filterTipo;
    return matchesSearch && matchesCliente && matchesTipo;
  });

  const getTipoInfo = (tipo: string) => {
    return tiposAcceso.find(t => t.value === tipo) || tiposAcceso[tiposAcceso.length - 1];
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  // Funciones para el informe
  const openInformeModal = (clienteIdPreseleccionado?: string) => {
    setInformeClienteId(clienteIdPreseleccionado || filterCliente || '');
    setInformeDestinatario('');
    setInformeAsunto('');
    setInformeMensaje('');
    setInformeError('');
    setInformeSuccess('');
    setShowInformeModal(true);
    
    // Si hay cliente preseleccionado, cargar su email
    if (clienteIdPreseleccionado || filterCliente) {
      const cliente = clientes.find(c => c.id === (clienteIdPreseleccionado || filterCliente));
      if (cliente?.email) {
        setInformeDestinatario(cliente.email);
      }
    }
  };

  const closeInformeModal = () => {
    setShowInformeModal(false);
    setInformeError('');
    setInformeSuccess('');
  };

  const handleClienteChange = (clienteId: string) => {
    setInformeClienteId(clienteId);
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente?.email) {
      setInformeDestinatario(cliente.email);
    } else {
      setInformeDestinatario('');
    }
  };

  const generarPDF = async () => {
    if (!informeClienteId) {
      setInformeError('Selecciona un cliente');
      return;
    }

    setGenerandoPDF(true);
    setInformeError('');

    try {
      // Obtener datos del cliente con sus accesos
      const res = await fetch(`/api/accesos/informe?clienteId=${informeClienteId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const cliente = await res.json();
      
      if (!cliente.accesos || cliente.accesos.length === 0) {
        throw new Error('El cliente no tiene accesos registrados');
      }

      // Crear PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Configurar fuente
      doc.setFont('helvetica');

      // Header
      doc.setFillColor(8, 145, 178); // cyan-600
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Informe de Accesos', pageWidth / 2, 22, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.razonSocial, pageWidth / 2, 34, { align: 'center' });

      y = 60;

      // Info del cliente
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(10);
      doc.text(`RUT: ${cliente.rut}`, margin, y);
      if (cliente.contacto) {
        doc.text(`Contacto: ${cliente.contacto}`, pageWidth / 2, y);
      }
      y += 6;
      if (cliente.telefono) {
        doc.text(`Teléfono: ${cliente.telefono}`, margin, y);
      }
      if (cliente.email) {
        doc.text(`Email: ${cliente.email}`, pageWidth / 2, y);
      }
      y += 15;

      // Línea separadora
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      // Accesos
      for (const acceso of cliente.accesos) {
        // Check si necesitamos nueva página
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Tipo y nombre
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 10, 2, 2, 'F');
        
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${tipoLabels[acceso.tipo] || acceso.tipo} - ${acceso.nombre}`, margin + 5, y + 2);
        y += 15;

        // Detalles
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // slate-600

        if (acceso.url) {
          doc.setFont('helvetica', 'bold');
          doc.text('URL:', margin + 5, y);
          doc.setFont('helvetica', 'normal');
          doc.text(acceso.url + (acceso.puerto ? `:${acceso.puerto}` : ''), margin + 25, y);
          y += 7;
        }

        if (acceso.usuario) {
          doc.setFont('helvetica', 'bold');
          doc.text('Usuario:', margin + 5, y);
          doc.setFont('helvetica', 'normal');
          doc.text(acceso.usuario, margin + 35, y);
          y += 7;
        }

        if (acceso.password) {
          doc.setFont('helvetica', 'bold');
          doc.text('Contraseña:', margin + 5, y);
          doc.setFont('helvetica', 'normal');
          doc.text(acceso.password, margin + 45, y);
          y += 7;
        }

        if (acceso.notas) {
          doc.setTextColor(148, 163, 184); // slate-400
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          const lines = doc.splitTextToSize(acceso.notas, pageWidth - margin * 2 - 10);
          doc.text(lines, margin + 5, y);
          y += lines.length * 5 + 3;
        }

        y += 10;
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Generado por its.dev • ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })} • Página ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        
        // Aviso de confidencialidad
        doc.setTextColor(239, 68, 68); // red-500
        doc.setFontSize(7);
        doc.text(
          '⚠️ CONFIDENCIAL - Esta información es privada y no debe ser compartida con terceros.',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      }

      // Descargar PDF
      doc.save(`Accesos_${cliente.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setInformeSuccess('PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setInformeError(error instanceof Error ? error.message : 'Error al generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const enviarInforme = async () => {
    if (!informeClienteId) {
      setInformeError('Selecciona un cliente');
      return;
    }
    if (!informeDestinatario) {
      setInformeError('Ingresa el email del destinatario');
      return;
    }

    setEnviandoInforme(true);
    setInformeError('');
    setInformeSuccess('');

    try {
      const res = await fetch('/api/accesos/informe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: informeClienteId,
          destinatario: informeDestinatario,
          asunto: informeAsunto,
          mensaje: informeMensaje,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setInformeSuccess('¡Correo enviado correctamente!');
    } catch (error) {
      console.error('Error al enviar:', error);
      setInformeError(error instanceof Error ? error.message : 'Error al enviar el correo');
    } finally {
      setEnviandoInforme(false);
    }
  };

  // Contar accesos por cliente para mostrar en el select del informe
  const getAccesosCount = (clienteId: string) => {
    return accesos.filter(a => a.clienteId === clienteId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Accesos</h1>
          <p className="text-slate-400 mt-1">Credenciales y accesos de tus clientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openInformeModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar Informe
          </button>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Acceso
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, URL, usuario o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          />
        </div>
        <select
          value={filterCliente}
          onChange={(e) => setFilterCliente(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all min-w-[200px]"
        >
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.razonSocial}</option>
          ))}
        </select>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all min-w-[160px]"
        >
          <option value="">Todos los tipos</option>
          {tiposAcceso.map((t) => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>
        
        {/* Botón rápido para generar informe del cliente filtrado */}
        {filterCliente && (
          <button
            onClick={() => openInformeModal(filterCliente)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all"
            title="Generar informe de este cliente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
        )}
      </div>

      {/* Accesos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filteredAccesos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p className="text-lg font-medium">No hay accesos</p>
          <p className="text-sm mt-1">Comienza agregando credenciales de tus clientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAccesos.map((acceso) => {
            const tipoInfo = getTipoInfo(acceso.tipo);
            const isPasswordVisible = showPasswords[acceso.id];
            
            return (
              <div
                key={acceso.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tipoInfo.icon}</span>
                    <div>
                      <h3 className="text-white font-semibold">{acceso.nombre}</h3>
                      {acceso.cliente && (
                        <p className="text-slate-500 text-sm">{acceso.cliente.razonSocial}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${tipoColors[acceso.tipo] || tipoColors.otro}`}>
                    {tipoInfo.label}
                  </span>
                </div>

                {/* Credentials */}
                <div className="space-y-2">
                  {acceso.url && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 w-16">URL:</span>
                      <span className="text-slate-300 flex-1 truncate font-mono">{acceso.url}{acceso.puerto && `:${acceso.puerto}`}</span>
                      <button
                        onClick={() => copyToClipboard(acceso.url + (acceso.puerto ? `:${acceso.puerto}` : ''), `url-${acceso.id}`)}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Copiar"
                      >
                        {copiedField === `url-${acceso.id}` ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                  {acceso.usuario && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 w-16">Usuario:</span>
                      <span className="text-slate-300 flex-1 truncate font-mono">{acceso.usuario}</span>
                      <button
                        onClick={() => copyToClipboard(acceso.usuario!, `user-${acceso.id}`)}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Copiar"
                      >
                        {copiedField === `user-${acceso.id}` ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                  {acceso.password && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 w-16">Clave:</span>
                      <span className="text-slate-300 flex-1 truncate font-mono">
                        {isPasswordVisible ? acceso.password : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => togglePassword(acceso.id)}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        title={isPasswordVisible ? 'Ocultar' : 'Mostrar'}
                      >
                        {isPasswordVisible ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(acceso.password!, `pass-${acceso.id}`)}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Copiar"
                      >
                        {copiedField === `pass-${acceso.id}` ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {acceso.notas && (
                  <p className="text-slate-500 text-sm mt-3 line-clamp-2">{acceso.notas}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/30">
                  <span className="text-xs text-slate-500">
                    Actualizado: {new Date(acceso.updatedAt).toLocaleDateString('es-CL')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(acceso)}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(acceso.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats by type */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {tiposAcceso.map((tipo) => {
          const count = accesos.filter(a => a.tipo === tipo.value).length;
          return (
            <div
              key={tipo.value}
              className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-center cursor-pointer hover:border-slate-600/50 transition-all ${filterTipo === tipo.value ? 'ring-2 ring-cyan-500/50' : ''}`}
              onClick={() => setFilterTipo(filterTipo === tipo.value ? '' : tipo.value)}
            >
              <span className="text-xl">{tipo.icon}</span>
              <p className="text-lg font-bold text-white mt-1">{count}</p>
              <p className="text-xs text-slate-500">{tipo.label}</p>
            </div>
          );
        })}
      </div>

      {/* Modal de Acceso */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingAcceso ? 'Editar Acceso' : 'Nuevo Acceso'}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  >
                    {tiposAcceso.map((t) => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cliente
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  >
                    <option value="">Sin cliente asociado</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.razonSocial}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Correo corporativo, Servidor web, cPanel..."
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL / IP
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://... o 192.168.1.1"
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Puerto
                  </label>
                  <input
                    type="text"
                    value={formData.puerto}
                    onChange={(e) => setFormData({ ...formData, puerto: e.target.value })}
                    placeholder="22, 3306..."
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  placeholder="Usuario o email de acceso"
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Contraseña de acceso"
                    className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
                    title="Generar contraseña segura"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                />
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

      {/* Modal de Informe */}
      {showInformeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeInformeModal} />
          <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generar Informe
              </h2>
              <button
                onClick={closeInformeModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {informeError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {informeError}
                </div>
              )}

              {informeSuccess && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {informeSuccess}
                </div>
              )}

              {/* Selección de cliente */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cliente <span className="text-red-400">*</span>
                </label>
                <select
                  value={informeClienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((c) => {
                    const count = getAccesosCount(c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.razonSocial} ({count} {count === 1 ? 'acceso' : 'accesos'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Botón de generar PDF */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar PDF
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Genera un PDF con todos los accesos del cliente para descargar localmente.
                </p>
                <button
                  onClick={generarPDF}
                  disabled={generandoPDF || !informeClienteId}
                  className="w-full px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generandoPDF ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar PDF
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-slate-800 text-slate-500">o</span>
                </div>
              </div>

              {/* Enviar por correo */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Enviar por Correo
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Envía el informe directamente al correo del cliente.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email destinatario <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={informeDestinatario}
                      onChange={(e) => setInformeDestinatario(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Asunto (opcional)
                    </label>
                    <input
                      type="text"
                      value={informeAsunto}
                      onChange={(e) => setInformeAsunto(e.target.value)}
                      placeholder="Informe de Accesos - [Nombre Cliente]"
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mensaje (opcional)
                    </label>
                    <textarea
                      value={informeMensaje}
                      onChange={(e) => setInformeMensaje(e.target.value)}
                      placeholder="Estimado cliente, adjunto encontrará el informe de accesos solicitado..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    onClick={enviarInforme}
                    disabled={enviandoInforme || !informeClienteId || !informeDestinatario}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {enviandoInforme ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Enviar Correo
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Cerrar */}
              <button
                onClick={closeInformeModal}
                className="w-full px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
