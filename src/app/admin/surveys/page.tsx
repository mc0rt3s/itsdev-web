'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Eye, Copy } from 'lucide-react';
import Link from 'next/link';

interface Survey {
  id: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
  createdAt: string;
  respuestas: { id: string; createdAt: string }[];
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '' });

  useEffect(() => {
    fetchSurveys();
  }, []);

  async function fetchSurveys() {
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      setSurveys(data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.titulo) return;

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchSurveys();
        setFormData({ titulo: '', descripcion: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error creating survey:', error);
    }
  }

  async function handleToggleActive(survey: Survey) {
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !survey.activo }),
      });

      if (res.ok) {
        fetchSurveys();
      }
    } catch (error) {
      console.error('Error toggling survey:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar encuesta?')) return;

    try {
      const res = await fetch(`/api/surveys/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSurveys();
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
    }
  }

  function copyPublicLink(id: string) {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado: ' + url);
  }

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Encuestas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Nueva Encuesta
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-100 p-4 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Título"
            value={formData.titulo}
            onChange={(e) =>
              setFormData({ ...formData, titulo: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Crear
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-slate-400 text-white px-4 py-2 rounded-lg hover:bg-slate-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {surveys.length === 0 ? (
          <p className="text-slate-500">No hay encuestas</p>
        ) : (
          surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white border rounded-lg p-4 flex justify-between items-start hover:shadow-lg transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{survey.titulo}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      survey.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {survey.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {survey.descripcion && (
                  <p className="text-slate-600 mt-1">{survey.descripcion}</p>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  {survey.respuestas.length} respuesta
                  {survey.respuestas.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => copyPublicLink(survey.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                  title="Copiar link público"
                >
                  <Copy size={18} />
                </button>
                <Link
                  href={`/admin/surveys/${survey.id}`}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                  title="Ver respuestas"
                >
                  <Eye size={18} />
                </Link>
                <button
                  onClick={() => handleToggleActive(survey)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    survey.activo
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {survey.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(survey.id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
