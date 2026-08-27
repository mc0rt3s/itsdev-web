export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">itsdev</h1>
        <p className="text-xl text-slate-300 mb-8">Platform de gestión y surveys</p>
        
        <div className="space-y-4">
          <a
            href="/admin/surveys"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Panel de Surveys
          </a>
          
          <div className="mt-8 pt-8 border-t border-slate-600">
            <p className="text-slate-400 text-sm">Versión Next.js 16 + Prisma + PostgreSQL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
