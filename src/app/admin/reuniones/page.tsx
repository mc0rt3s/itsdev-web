"use client";

import { useCallback, useEffect, useState } from "react";

interface ClienteLite {
  id: string;
  razonSocial: string;
  rut: string;
  email: string | null;
  contacto: string | null;
}

interface Reunion {
  id: string;
  asunto: string;
  notas: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  cliente: ClienteLite | null;
  oportunidad: { id: string; titulo: string; stage: { name: string } } | null;
}

function parseNotas(notas: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  (notas || "")
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      const i = line.indexOf(":");
      if (i > 0) out[line.slice(0, i)] = line.slice(i + 1);
    });
  return out;
}

function fmt(dt: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export default function ReunionesPage() {
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [clientes, setClientes] = useState<ClienteLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [mode, setMode] = useState<"existente" | "nuevo">("existente");
  const [selCliente, setSelCliente] = useState("");
  const [nuevo, setNuevo] = useState({ rut: "", razonSocial: "", contacto: "", email: "" });
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/reuniones");
      if (r.ok) setReuniones(await r.json());
      else setError("No autorizado o error al cargar reuniones");
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/clientes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setClientes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [load]);

  async function convertir(reunionId: string) {
    setWorking(true);
    const body: any = { reunionId };
    if (mode === "existente" && selCliente) body.clienteId = selCliente;
    if (mode === "nuevo") {
      body.crearCliente = { rut: nuevo.rut, razonSocial: nuevo.razonSocial, contacto: nuevo.contacto, email: nuevo.email };
    }
    const r = await fetch("/api/reuniones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setWorking(false);
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      setConvertId(null);
      setSelCliente("");
      setNuevo({ rut: "", razonSocial: "", contacto: "", email: "" });
      load();
    } else {
      setError(data.error || "Error al convertir");
    }
  }

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-2">Reuniones</h1>
      <p className="text-slate-400 mb-6">
        Citas agendadas desde citas.itsdev.cl. Convierte a oportunidad solo cuando la reunión llegue a buen puerto.
      </p>

      {error && <div className="mb-4 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 px-4 py-3">{error}</div>}

      {loading ? (
        <p className="text-slate-400">Cargando…</p>
      ) : reuniones.length === 0 ? (
        <p className="text-slate-500">Aún no hay reuniones registradas.</p>
      ) : (
        <div className="space-y-3">
          {reuniones.map((re) => {
            const n = parseNotas(re.notas);
            const cancelada = (re.notas || "").includes("estado:cancelada");
            return (
              <div key={re.id} className="rounded-xl bg-slate-800 border border-slate-700 p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{re.asunto}</span>
                    {cancelada && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Cancelada</span>
                    )}
                    {re.oportunidad && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                        Oportunidad: {re.oportunidad.stage?.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {fmt(re.scheduledAt)}
                    {re.cliente ? ` · ${re.cliente.razonSocial}${re.cliente.email ? ` (${re.cliente.email})` : ""}` : ` · ${n.email || n.name || "sin datos"}`}
                  </div>
                  {n.notas && <div className="text-sm text-slate-500 mt-1">Nota: {n.notas}</div>}
                </div>

                {!re.oportunidad && !cancelada && (
                  <button
                    onClick={() => { setConvertId(re.id); setError(null); }}
                    className="shrink-0 px-4 py-2 rounded-lg bg-[#7AA228] hover:bg-[#6A9020] text-white text-sm font-semibold"
                  >
                    Convertir en oportunidad
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {convertId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Convertir reunión en oportunidad</h3>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setMode("existente")}
                className={`flex-1 py-2 rounded-lg text-sm ${mode === "existente" ? "bg-[#7AA228] text-white" : "bg-slate-700 text-slate-300"}`}
              >
                Cliente existente
              </button>
              <button
                onClick={() => setMode("nuevo")}
                className={`flex-1 py-2 rounded-lg text-sm ${mode === "nuevo" ? "bg-[#7AA228] text-white" : "bg-slate-700 text-slate-300"}`}
              >
                Nuevo cliente
              </button>
            </div>

            {mode === "existente" && (
              <select
                value={selCliente}
                onChange={(e) => setSelCliente(e.target.value)}
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm mb-4"
              >
                <option value="">Selecciona un cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial} ({c.rut}){c.email ? ` - ${c.email}` : ""}
                  </option>
                ))}
              </select>
            )}

            {mode === "nuevo" && (
              <div className="space-y-2 mb-4">
                <input value={nuevo.rut} onChange={(e) => setNuevo({ ...nuevo, rut: e.target.value })} placeholder="RUT *" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm" />
                <input value={nuevo.razonSocial} onChange={(e) => setNuevo({ ...nuevo, razonSocial: e.target.value })} placeholder="Razón social *" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm" />
                <input value={nuevo.contacto} onChange={(e) => setNuevo({ ...nuevo, contacto: e.target.value })} placeholder="Contacto" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm" />
                <input value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} placeholder="Email" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm" />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setConvertId(null)} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm">Cancelar</button>
              <button
                onClick={() => convertir(convertId)}
                disabled={working || (mode === "existente" ? !selCliente : !nuevo.rut || !nuevo.razonSocial)}
                className="px-4 py-2 rounded-lg bg-[#7AA228] hover:bg-[#6A9020] text-white text-sm font-semibold disabled:opacity-50"
              >
                {working ? "Convirtiendo…" : "Convertir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
