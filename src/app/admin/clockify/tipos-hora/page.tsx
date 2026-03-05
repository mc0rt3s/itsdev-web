'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ClockifyTaskTipo {
  id: string;
  clockifyTaskId: string;
  clockifyProjectId: string | null;
  nombre: string;
  tipoHora: string;
}

export default function ClockifyTiposHoraPage() {
  const toast = useToast();
  const [items, setItems] = useState<ClockifyTaskTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClockifyTaskTipo | null>(null);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; name: string }>>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [loadingCf, setLoadingCf] = useState(false);
  const [formData, setFormData] = useState({
    clockifyTaskId: '',
    clockifyProjectId: '' as string | null,
    nombre: '',
    tipoHora: 'habil' as 'habil' | 'inhabil',
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; nombre: string }>({ isOpen: false, id: '', nombre: '' });

  useEffect(() => {
    fetchItems();
    fetchWorkspaces();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/clockify/task-tipos');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/clockify/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(Array.isArray(data) ? data : []);
      }
    } catch {
      setWorkspaces([]);
    }
  };

  const fetchProjects = async (wid: string) => {
    if (!wid) {
      setProjects([]);
      setTasks([]);
      setProjectId('');
      return;
    }
    setLoadingCf(true);
    try {
      const res = await fetch(`/api/clockify/workspaces/${wid}/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoadingCf(false);
    }
    setProjectId('');
    setTasks([]);
  };

  const fetchTasks = async (wid: string, pid: string) => {
    if (!wid || !pid) {
      setTasks([]);
      return;
    }
    setLoadingCf(true);
    try {
      const res = await fetch(`/api/clockify/workspaces/${wid}/projects/${pid}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    } finally {
      setLoadingCf(false);
    }
  };

  const openModal = (item?: ClockifyTaskTipo) => {
    if (item) {
      setEditing(item);
      setFormData({
        clockifyTaskId: item.clockifyTaskId,
        clockifyProjectId: item.clockifyProjectId || null,
        nombre: item.nombre,
        tipoHora: item.tipoHora as 'habil' | 'inhabil',
      });
    } else {
      setEditing(null);
      setFormData({
        clockifyTaskId: '',
        clockifyProjectId: null,
        nombre: '',
        tipoHora: 'habil',
      });
      setWorkspaceId('');
      setProjectId('');
      setProjects([]);
      setTasks([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/clockify/task-tipos/${editing.id}` : '/api/clockify/task-tipos';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockifyTaskId: formData.clockifyTaskId,
          clockifyProjectId: formData.clockifyProjectId || null,
          nombre: formData.nombre,
          tipoHora: formData.tipoHora,
        }),
      });
      if (res.ok) {
        toast.success(editing ? 'Actualizado' : 'Agregado');
        closeModal();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const res = await fetch(`/api/clockify/task-tipos/${confirmDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Eliminado');
        setConfirmDelete({ isOpen: false, id: '', nombre: '' });
        fetchItems();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Clockify – Tipos de hora</h1>
          <p className="text-slate-400 mt-1">Define si cada tarea de Clockify es hora hábil o inhábil para facturación</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Agregar tipo de hora
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>No hay tipos de hora configurados.</p>
            <p className="text-sm mt-1">Agrega tareas de Clockify y asígnales hora hábil o inhábil.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Tarea</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Tipo</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                    <td className="py-4 px-6 text-white font-medium">{item.nombre}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${
                        item.tipoHora === 'habil'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {item.tipoHora === 'habil' ? 'Hora hábil' : 'Hora inhábil'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ isOpen: true, id: item.id, nombre: item.nombre })}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg ml-1"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editing ? 'Editar tipo de hora' : 'Agregar tipo de hora'}
              </h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-white rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Workspace Clockify</label>
                    <select
                      value={workspaceId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setWorkspaceId(id);
                        fetchProjects(id);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                      <option value="">Seleccionar workspace</option>
                      {workspaces.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Proyecto</label>
                    <select
                      value={projectId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setProjectId(id);
                        fetchTasks(workspaceId, id);
                        setFormData((f) => ({ ...f, clockifyTaskId: '', nombre: '', clockifyProjectId: id || null }));
                      }}
                      disabled={!workspaceId || loadingCf}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
                    >
                      <option value="">Seleccionar proyecto</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tarea de Clockify</label>
                    <select
                      value={formData.clockifyTaskId}
                      onChange={(e) => {
                        const taskId = e.target.value;
                        const task = tasks.find((t) => t.id === taskId);
                        setFormData((f) => ({
                          ...f,
                          clockifyTaskId: taskId,
                          nombre: task?.name || '',
                        }));
                      }}
                      disabled={!projectId || loadingCf}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
                      required
                    >
                      <option value="">Seleccionar tarea</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre (para mostrar)</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                  placeholder="Ej: Hora hábil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de hora</label>
                <select
                  value={formData.tipoHora}
                  onChange={(e) => setFormData({ ...formData, tipoHora: e.target.value as 'habil' | 'inhabil' })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="habil">Hora hábil</option>
                  <option value="inhabil">Hora inhábil</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Eliminar tipo de hora"
        message={`¿Eliminar "${confirmDelete.nombre}"? Esta acción no se puede deshacer.`}
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: '', nombre: '' })}
      />
    </div>
  );
}
