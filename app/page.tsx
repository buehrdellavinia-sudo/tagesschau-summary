import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const redis = new Redis(process.env.REDIS_URL || '');
  const rawData = await redis.get('latest_summary');
  const data = rawData ? JSON.parse(rawData) : null;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-4xl font-bold mb-8 text-blue-800">Tagesschau Zusammenfassung</h1>
      
      {data ? (
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">{data.title}</h2>
          <p className="text-gray-500 mb-4">{new Date(data.date).toLocaleString('de-DE')}</p>
          <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
            {data.summary}
          </div>
          <a href={data.url} target="_blank" className="mt-6 inline-block text-blue-600 underline">
            Zum Video auf YouTube
          </a>
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed rounded-xl text-gray-500">
          Noch keine Zusammenfassung verfügbar. Der Cron-Job läuft täglich um 20:15 Uhr.
        </div>
      )}
    </main>
  );
}
