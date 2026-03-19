import { kv } from '@vercel/kv';

export const revalidate = 3600; // revalidate every hour
export const dynamic = 'force-dynamic'; // Ensures it updates or is correctly deployed on Vercel

export default async function Home() {
  let summaries: any[] = [];
  try {
    summaries = await kv.lrange('tagesschau_summaries', 0, 9); // get top 10
  } catch(e) {
    console.error("KV not configured or error", e);
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-12">
      <header className="border-b border-blue-200 dark:border-blue-900 pb-8 text-center mt-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
          Tagesschau in x Sekunden
        </h1>
        <p className="mt-4 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Tägliche KI-generierte Zusammenfassungen und visuelle Analysen der neuesten Ausgaben.
        </p>
      </header>
      
      {summaries.length === 0 ? (
        <div className="p-8 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm text-center">
          <h3 className="text-lg font-bold mb-2">Noch keine Analysen verfügbar</h3>
          <p>
            Der automatisierte Hintergrundprozess prüft täglich um 20:15 Uhr auf neue Videos.
            Wenn du dieses Projekt neu eingerichtet hast, stelle sicher, dass Vercel KV (Redis) aktiviert wurde.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {summaries.map((item, index) => (
            <article key={item.id + '-' + index} className="p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold leading-tight">
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {item.title}
                  </a>
                </h2>
                <time className="shrink-0 text-sm px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                  {new Date(item.date).toLocaleDateString('de-DE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })} Uhr
                </time>
              </div>
              <div className="prose dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300 marker:text-blue-500 prose-a:text-blue-600 prose-headings:text-slate-900 dark:prose-headings:text-slate-100">
                {item.summary.split('\\n').map((paragraph: string, i: number) => {
                  if (paragraph.trim().startsWith('* ') || paragraph.trim().startsWith('- ')) {
                    return (
                      <ul key={i} className="my-2 list-disc list-inside">
                        <li>{paragraph.replace(/^[-*]\\s+/, '')}</li>
                      </ul>
                    );
                  }
                  if (paragraph.trim().startsWith('#')) {
                    const level = paragraph.match(/^#+/)?.[0].length || 1;
                    const text = paragraph.replace(/^#+\\s+/, '');
                    const Tag = \`h\${Math.min(level + 2, 6)}\` as keyof JSX.IntrinsicElements;
                    return <Tag key={i} className="mt-6 mb-3 font-bold">{text}</Tag>;
                  }
                  return paragraph.trim() ? <p key={i} className="mb-4">{paragraph}</p> : null;
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
