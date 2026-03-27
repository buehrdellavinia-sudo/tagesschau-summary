import Redis from 'ioredis';

export const dynamic = 'force-dynamic'; // Ensures it updates or is correctly deployed on Vercel

export default async function Page() {
  let summaries: any[] = [];
  try {
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL);
      const rawData = await redis.lrange('tagesschau_summaries', 0, -1); // get all old and new summaries
      summaries = rawData.map((item: string) => JSON.parse(item));
    }
  } catch(e) {
    console.error("Redis not configured or error", e);
  }

  return (
    <main className="min-h-screen p-6 md:p-12 lg:p-24 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950"></div>
        <div className="absolute top-0 right-0 -mr-[40%] md:-mr-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-bl from-blue-200/50 via-purple-100/30 to-transparent dark:from-blue-800/20 dark:via-purple-900/10 blur-3xl mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        <header className="text-center space-y-6 pt-8 md:pt-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800/50 text-sm font-semibold mb-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            KI-Archiv der Tagesschau
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-300 pb-2">
            In wenigen <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 drop-shadow-sm">Sekunden</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed mt-4">
            Übersichtliche, automatisierte Transkriptionen und visuelle Analysen aller archivierten Sendungen.
          </p>
        </header>

        {summaries.length === 0 ? (
          <div className="p-12 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-xl text-center max-w-2xl mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-white/50 dark:ring-white/10">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Noch keine Analysen verfügbar</h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Der Algorithmus prüft täglich nach neuen Veröffentlichungen. 
              Sobald die erste Ausgabe verarbeitet wurde, erscheint sie hier.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {summaries.map((item, index) => (
              <article key={item.id + '-' + index} className="group relative p-8 md:p-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:bg-white/90 dark:hover:bg-slate-900/90 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-700 ease-out"></div>
                
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 pb-8 border-b border-slate-100 dark:border-slate-800/80">
                  <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-slate-900 dark:text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 dark:group-hover:from-blue-400 dark:group-hover:to-indigo-400 transition-all duration-300 xl:pr-8">
                    <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                      {item.title}
                      <svg className="w-8 h-8 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </h2>
                  <time className="shrink-0 flex items-center gap-2 px-6 py-3 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold text-sm shadow-inner whitespace-nowrap border border-slate-200 dark:border-slate-700">
                    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(item.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                </div>
                
                <div className="prose dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300 prose-p:leading-relaxed prose-p:mb-5 last:prose-p:mb-0">
                  {item.summary.split(/\n|\\n/).map((paragraph: string, i: number) => {
                    if (!paragraph.trim()) return null;
                    return <p key={i}>{paragraph}</p>;
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
