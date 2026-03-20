import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const redis = new Redis(process.env.REDIS_URL || '');
  const rawData = await redis.get('tagesschau_archive');
  const archive = rawData ? JSON.parse(rawData) : [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-[#003865] text-white py-12 px-6 shadow-md">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Tagesschau Archiv</h1>
          <p className="text-blue-200 text-lg">KI-generierte Analysen & visuelle Beschreibungen der neuesten Ausgaben.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6">
        {archive.length > 0 ? (
          <div className="grid gap-12">
            {archive.map((item: any, index: number) => (
              <article key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row ${index === 0 ? 'ring-2 ring-blue-500' : ''}`}>
                
                {/* Thumbnail */}
                <div className="md:w-1/3 bg-gray-200">
                  <img src={item.thumbnail} alt="Video Preview" className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div className="p-8 md:w-2/3 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 leading-tight">{item.title}</h2>
                    {index === 0 && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Neu</span>}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6">Analysiert am {new Date(item.date).toLocaleString('de-DE')}</p>
                  
                  <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap flex-grow">
                    {item.summary}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <a href={item.url} target="_blank" className="inline-flex items-center text-blue-700 font-bold hover:text-blue-900 transition-colors">
                      Auf YouTube ansehen
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-300">
            <p className="text-xl text-gray-400">Das Archiv wird gerade aufgebaut...</p>
            <p className="text-sm text-gray-400 mt-2">Der Roboter sucht alle 2 Stunden nach neuen Sendungen.</p>
          </div>
        )}
      </main>

      <footer className="py-12 text-center text-gray-400 text-sm">
        &copy; 2026 Tagesschau KI-Summary Project | Agentic Engineering Seminar
      </footer>
    </div>
  );
}
