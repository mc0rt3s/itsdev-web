'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

interface SurveyResponse {
  id: string;
  pregunta1: string | null;
  pregunta2: string | null;
  pregunta3: string | null;
  pregunta4: string | null;
  pregunta5: string | null;
  createdAt: string;
}

interface Survey {
  id: string;
  titulo: string;
  descripcion: string;
  respuestas: SurveyResponse[];
}

const questions = [
  { num: 1, text: '¿Usas Softland/Edig?' },
  { num: 2, text: '¿Tiempo máximo aceptas migración?' },
  { num: 3, text: '¿Web o Desktop?' },
  { num: 4, text: '¿Qué duele más?' },
  { num: 5, text: '¿Pagarías setup ($1000)?' },
];

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveyId, setSurveyId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSurveyId(p.id));
  }, [params]);

  useEffect(() => {
    if (!surveyId) return;
    async function fetch() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}`);
        if (res.ok) {
          setSurvey(await res.json());
        }
      } catch (error) {
        console.error('Error fetching survey:', error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [surveyId]);

  function exportToCSV() {
    if (!survey) return;

    const headers = ['Fecha', ...questions.map((q) => q.text)];
    const rows = survey.respuestas.map((r) => [
      new Date(r.createdAt).toLocaleString('es-CL'),
      r.pregunta1 || '',
      r.pregunta2 || '',
      r.pregunta3 || '',
      r.pregunta4 || '',
      r.pregunta5 || '',
    ]);

    const csv =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n') + '\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `encuesta-${survey.id}.csv`);
    link.click();
  }

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!survey) return <div className="p-6">Encuesta no encontrada</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/surveys"
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{survey.titulo}</h1>
          {survey.descripcion && (
            <p className="text-slate-600 mt-1">{survey.descripcion}</p>
          )}
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <Download size={20} /> Exportar CSV
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Respuestas ({survey.respuestas.length})
        </h2>

        {survey.respuestas.length === 0 ? (
          <p className="text-slate-500">Sin respuestas aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b">
                  <th className="border px-4 py-2 text-left text-xs font-semibold">
                    Fecha
                  </th>
                  {questions.map((q) => (
                    <th
                      key={q.num}
                      className="border px-4 py-2 text-left text-xs font-semibold"
                    >
                      P{q.num}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {survey.respuestas.map((resp, idx) => (
                  <tr key={resp.id} className="border-b hover:bg-slate-50">
                    <td className="border px-4 py-2 text-sm whitespace-nowrap">
                      {new Date(resp.createdAt).toLocaleString('es-CL')}
                    </td>
                    <td className="border px-4 py-2 text-sm">{resp.pregunta1}</td>
                    <td className="border px-4 py-2 text-sm">{resp.pregunta2}</td>
                    <td className="border px-4 py-2 text-sm">{resp.pregunta3}</td>
                    <td className="border px-4 py-2 text-sm">{resp.pregunta4}</td>
                    <td className="border px-4 py-2 text-sm">{resp.pregunta5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen de respuestas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q) => {
          const responses = survey.respuestas
            .map((r) => r[`pregunta${q.num}` as keyof SurveyResponse])
            .filter((v) => v !== null);

          const uniqueAnswers = [...new Set(responses)];

          return (
            <div key={q.num} className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                P{q.num}: {q.text}
              </h3>
              <div className="space-y-1 text-sm">
                {uniqueAnswers.map((answer) => {
                  const count = responses.filter(
                    (r) => r === answer
                  ).length;
                  const pct = ((count / responses.length) * 100).toFixed(0);
                  return (
                    <div key={answer} className="flex justify-between">
                      <span>{answer}</span>
                      <span className="font-semibold">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
