'use client';

import { useState, useEffect, useRef } from 'react';

interface SiiConfig {
  id?: string;
  certBase64?: string;
  certPassword?: string;
  rutFirmante: string;
  rutEmpresa: string;
  razonSocial: string;
  giro: string;
  acteco: number;
  direccion: string;
  comuna: string;
  ciudad: string;
  fechaResolucion: string;
  numResolucion: number;
  ambiente: 'certification' | 'production';
}

interface CafRow {
  id: string;
  tipoDte: number;
  folioDesde: number;
  folioHasta: number;
  folioActual: number;
  ambiente: string;
  updatedAt: string;
}

const defaultConfig: SiiConfig = {
  certBase64: '',
  certPassword: '',
  rutFirmante: '',
  rutEmpresa: '',
  razonSocial: '',
  giro: '',
  acteco: 0,
  direccion: '',
  comuna: '',
  ciudad: '',
  fechaResolucion: '',
  numResolucion: 0,
  ambiente: 'certification',
};

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<'sii' | 'caf'>('sii');
  const [config, setConfig] = useState<SiiConfig>(defaultConfig);
  const [certFileName, setCertFileName] = useState<string>('');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [configMsg, setConfigMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [cafs, setCafs] = useState<CafRow[]>([]);
  const [cafsLoaded, setCafsLoaded] = useState(false);
  const [cafXml, setCafXml] = useState('');
  const [cafAmbiente, setCafAmbiente] = useState<'certification' | 'production'>('certification');
  const [cafFileName, setCafFileName] = useState('');
  const [uploadingCaf, setUploadingCaf] = useState(false);
  const [cafMsg, setCafMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cafFileRef = useRef<HTMLInputElement>(null);
  const certFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/configuracion/sii')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setConfig({ ...defaultConfig, ...data.config, certBase64: '', certPassword: '' });
          setConfigLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'caf' && !cafsLoaded) {
      fetch('/api/configuracion/sii/caf')
        .then(r => r.json())
        .then(data => { setCafs(data.cafs || []); setCafsLoaded(true); })
        .catch(() => {});
    }
  }, [tab, cafsLoaded]);

  function handleCertFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(result);
      let binary = '';
      bytes.forEach(b => { binary += String.fromCharCode(b); });
      setConfig(prev => ({ ...prev, certBase64: btoa(binary) }));
    };
    reader.readAsArrayBuffer(file);
  }

  function handleCafFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCafFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCafXml((ev.target?.result as string) || '');
    reader.readAsText(file);
  }

  async function saveConfig() {
    setSavingConfig(true);
    setConfigMsg(null);
    try {
      const payload: Record<string, unknown> = { ...config };
      if (!payload.certBase64) delete payload.certBase64;
      if (!payload.certPassword) delete payload.certPassword;

      if (configLoaded && !config.certBase64) {
        const existing = await fetch('/api/configuracion/sii').then(r => r.json());
        if (existing.config) {
          setConfigMsg({ ok: false, text: 'Debes subir el certificado .p12 nuevamente para guardar.' });
          setSavingConfig(false);
          return;
        }
      }

      const res = await fetch('/api/configuracion/sii', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      setConfigMsg({ ok: true, text: 'Configuración guardada correctamente.' });
      setConfigLoaded(true);
    } catch (e) {
      setConfigMsg({ ok: false, text: e instanceof Error ? e.message : 'Error al guardar' });
    } finally {
      setSavingConfig(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/configuracion/sii/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setTestResult({ ok: true, message: `Autenticado en SII (${data.ambiente}). Token recibido.` });
      } else {
        setTestResult({ ok: false, message: data.error || 'Error desconocido' });
      }
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : 'Error de red' });
    } finally {
      setTesting(false);
    }
  }

  async function uploadCaf() {
    if (!cafXml) { setCafMsg({ ok: false, text: 'Selecciona un archivo CAF primero.' }); return; }
    setUploadingCaf(true);
    setCafMsg(null);
    try {
      const res = await fetch('/api/configuracion/sii/caf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: cafXml, ambiente: cafAmbiente }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir CAF');
      setCafMsg({ ok: true, text: `CAF tipo ${data.tipoDte} cargado: folios ${data.folioDesde}–${data.folioHasta}` });
      setCafXml('');
      setCafFileName('');
      if (cafFileRef.current) cafFileRef.current.value = '';
      setCafsLoaded(false);
    } catch (e) {
      setCafMsg({ ok: false, text: e instanceof Error ? e.message : 'Error al subir CAF' });
    } finally {
      setUploadingCaf(false);
    }
  }

  async function deleteCaf(id: string) {
    if (!confirm('¿Eliminar este CAF?')) return;
    await fetch(`/api/configuracion/sii/caf?id=${id}`, { method: 'DELETE' });
    setCafsLoaded(false);
  }

  const field = (label: string, key: keyof SiiConfig, type: string = 'text', hint?: string) => (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={String(config[key] ?? '')}
        onChange={e => setConfig(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );

  const dteName: Record<number, string> = { 33: 'Factura Electrónica', 34: 'Factura Exenta', 61: 'Nota de Crédito' };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {(['sii', 'caf'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? 'text-cyan-400 border-cyan-400' : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {t === 'sii' ? 'SII / Certificado' : 'Folios (CAF)'}
          </button>
        ))}
      </div>

      {/* SII Config tab */}
      {tab === 'sii' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-cyan-400">Certificado Digital</h2>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Archivo .p12{configLoaded && <span className="ml-2 text-xs text-green-400">(ya configurado)</span>}
              </label>
              <input
                ref={certFileRef}
                type="file"
                accept=".p12,.pfx"
                onChange={handleCertFile}
                className="hidden"
                id="cert-file"
              />
              <label
                htmlFor="cert-file"
                className="inline-flex items-center gap-2 cursor-pointer bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {certFileName || 'Seleccionar certificado .p12'}
              </label>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Clave del certificado</label>
              <input
                type="password"
                value={config.certPassword || ''}
                onChange={e => setConfig(prev => ({ ...prev, certPassword: e.target.value }))}
                placeholder={configLoaded ? '(dejar vacío mantiene la actual — NO, debes reingresarla)' : ''}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-cyan-400">Datos del Emisor</h2>

            <div className="grid grid-cols-2 gap-4">
              {field('RUT Empresa', 'rutEmpresa', 'text', 'Ej: 76123456-7')}
              {field('RUT Firmante', 'rutFirmante', 'text', 'RUT del representante legal')}
            </div>
            {field('Razón Social', 'razonSocial')}
            {field('Giro', 'giro')}
            <div className="grid grid-cols-2 gap-4">
              {field('Código Actividad Económica', 'acteco', 'number')}
              {field('Ciudad', 'ciudad')}
            </div>
            {field('Dirección', 'direccion')}
            {field('Comuna', 'comuna')}
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-cyan-400">Resolución SII</h2>

            <div className="grid grid-cols-2 gap-4">
              {field('Fecha Resolución', 'fechaResolucion', 'date')}
              {field('N° Resolución', 'numResolucion', 'number')}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Ambiente</label>
              <select
                value={config.ambiente}
                onChange={e => setConfig(prev => ({ ...prev, ambiente: e.target.value as 'certification' | 'production' }))}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="certification">Certificación (pruebas)</option>
                <option value="production">Producción</option>
              </select>
            </div>
          </div>

          {configMsg && (
            <div className={`rounded-lg px-4 py-3 text-sm ${configMsg.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {configMsg.text}
            </div>
          )}

          {testResult && (
            <div className={`rounded-lg px-4 py-3 text-sm ${testResult.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {testResult.message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveConfig}
              disabled={savingConfig}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {savingConfig ? 'Guardando...' : 'Guardar configuración'}
            </button>
            <button
              onClick={testConnection}
              disabled={testing || !configLoaded}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {testing ? 'Probando...' : 'Probar conexión SII'}
            </button>
          </div>
        </div>
      )}

      {/* CAF tab */}
      {tab === 'caf' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-cyan-400">Subir CAF</h2>
            <p className="text-sm text-slate-400">
              Los folios (CAF) se descargan del portal SII en <strong className="text-white">sii.cl → Servicios Online → Factura Electrónica → Solicitar Folios</strong>.
            </p>

            <div>
              <input
                ref={cafFileRef}
                type="file"
                accept=".xml,text/xml"
                onChange={handleCafFile}
                className="hidden"
                id="caf-file"
              />
              <label
                htmlFor="caf-file"
                className="inline-flex items-center gap-2 cursor-pointer bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {cafFileName || 'Seleccionar archivo CAF (.xml)'}
              </label>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Ambiente</label>
              <select
                value={cafAmbiente}
                onChange={e => setCafAmbiente(e.target.value as 'certification' | 'production')}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="certification">Certificación</option>
                <option value="production">Producción</option>
              </select>
            </div>

            {cafMsg && (
              <div className={`rounded-lg px-4 py-3 text-sm ${cafMsg.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {cafMsg.text}
              </div>
            )}

            <button
              onClick={uploadCaf}
              disabled={uploadingCaf || !cafXml}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {uploadingCaf ? 'Subiendo...' : 'Cargar CAF'}
            </button>
          </div>

          {/* CAF list */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-cyan-400 mb-4">CAFs cargados</h2>
            {!cafsLoaded ? (
              <p className="text-slate-400 text-sm">Cargando...</p>
            ) : cafs.length === 0 ? (
              <p className="text-slate-400 text-sm">No hay CAFs cargados.</p>
            ) : (
              <div className="space-y-3">
                {cafs.map(caf => {
                  const usados = caf.folioActual - caf.folioDesde + 1;
                  const disponibles = caf.folioHasta - caf.folioActual;
                  const pct = Math.round((usados / (caf.folioHasta - caf.folioDesde + 1)) * 100);
                  const low = disponibles <= 5;
                  return (
                    <div key={caf.id} className={`rounded-lg border p-4 ${low ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-600 bg-slate-700/30'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium text-white">
                            DTE {caf.tipoDte} — {dteName[caf.tipoDte] || `Tipo ${caf.tipoDte}`}
                          </span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${caf.ambiente === 'production' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {caf.ambiente === 'production' ? 'producción' : 'certificación'}
                          </span>
                          <div className="text-sm text-slate-400 mt-1">
                            Folios {caf.folioDesde}–{caf.folioHasta} · Siguiente: {caf.folioActual + 1} · {disponibles} disponibles
                          </div>
                        </div>
                        <button onClick={() => deleteCaf(caf.id)} className="text-slate-500 hover:text-red-400 transition-colors ml-4">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {low && (
                        <p className="text-amber-400 text-xs mt-2 font-medium">Quedan pocos folios — descarga un nuevo CAF pronto.</p>
                      )}
                      <div className="mt-3 bg-slate-600/50 rounded-full h-1.5">
                        <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
