'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

interface Survey {
  id: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
}

const questions = [
  {
    num: 1,
    text: '¿Usas Softland/Edig?',
    options: ['Sí', 'No'],
  },
  {
    num: 2,
    text: 'Si migras a sistema nuevo, cuánto tiempo máximo aceptas migración?',
    options: ['1 día', '2-3 días', '1 semana', 'no sé'],
  },
  {
    num: 3,
    text: '¿Trabajas en web (online) o necesitas desktop offline?',
    options: ['Web', 'Desktop', 'Ambos'],
  },
  {
    num: 4,
    text: '¿Qué duele más ahora?',
    options: [
      'UI antigua',
      'reportes lentos',
      'integraciones',
      'normativa desactualizada',
      'otro',
    ],
  },
  {
    num: 5,
    text: '¿Pagarías setup ($1000) si migración es automática y sin pérdida de datos?',
    options: ['Sí', 'No', 'tal vez'],
  },
];

export default function SurveyFormPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (Object.keys(answers).length !== 5) {
      alert('Por favor, responde todas las preguntas');
      return;
    }

    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta1: answers[1],
          pregunta2: answers[2],
          pregunta3: answers[3],
          pregunta4: answers[4],
          pregunta5: answers[5],
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('Error al enviar respuestas');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Error al enviar respuestas');
    }
  }

  if (loading) return <div className="p-6 text-center">Cargando...</div>;

  if (!survey)
    return <div className="p-6 text-center text-red-600">Encuesta no encontrada</div>;

  if (!survey.activo)
    return (
      <div className="p-6 text-center text-yellow-600">
        Esta encuesta ya no está disponible
      </div>
    );

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center space-y-4">
          <CheckCircle size={64} className="mx-auto text-green-600" />
          <h1 className="text-2xl font-bold">¡Gracias!</h1>
          <p className="text-slate-600">
            Tus respuestas han sido registradas correctamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{survey.titulo}</h1>
            {survey.descripcion && (
              <p className="text-slate-600 mt-2">{survey.descripcion}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q) => (
              <div key={q.num} className="space-y-3 pb-6 border-b last:border-b-0">
                <h2 className="font-semibold text-lg text-slate-900">
                  {q.num}. {q.text}
                </h2>
                <div className="space-y-2">
                  {q.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                      style={{
                        borderColor:
                          answers[q.num] === option ? '#3b82f6' : '#e2e8f0',
                        backgroundColor:
                          answers[q.num] === option ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q${q.num}`}
                        value={option}
                        checked={answers[q.num] === option}
                        onChange={(e) => {
                          setAnswers({
                            ...answers,
                            [q.num]: e.target.value,
                          });
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="ml-3 text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Enviar Respuestas
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center">
            Tus respuestas son confidenciales y se usan solo con fines de investigación.
          </p>
        </div>
      </div>
    </div>
  );
}
