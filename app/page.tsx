import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Wir nutzen NUR ioredis mit deiner REDIS_URL
  const redis = new Redis(process.env.REDIS_URL || '');
  let data = null;

  try {
    const rawData = await redis.get('latest_summary');
    data = rawData ? JSON.parse(rawData) : null;
  } catch (e) {
    console.error("Datenbank-Fehler:", e);
  }

  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#1e40af', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Tagesschau Zusammenfassung
      </h1>
      
      {data ? (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ color: '#111827', marginBottom: '8px' }}>{data.title}</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>
            {new Date(data.date).toLocaleString('de-DE')}
          </p>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#374151' }}>
            {data.summary}
          </div>
          <div style={{ marginTop: '24px' }}>
            <a href={data.url} target="_blank" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>
              Video auf YouTube ansehen →
            </a>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '40px', padding: '40px', textAlign: 'center', border: '2px dashed #d1d5db', borderRadius: '12px', color: '#9ca3af' }}>
          <p>Noch keine Zusammenfassung gespeichert.</p>
          <p style={{ fontSize: '0.8rem' }}>Der nächste automatische Check läuft um 20:15 Uhr.</p>
        </div>
      )}
    </main>
  );
}
