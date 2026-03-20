import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // Wir nutzen gemini-1.5-flash für stabile Video-Analyse
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const playlistId = 'PL4A2F331EE86DCC22';
    const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`;
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();
    
    const video = ytData.items[0].snippet;
    const videoId = video.resourceId.videoId;

    // PRÜFUNG: Haben wir dieses Video schon analysiert?
    const existingData = await redis.get('tagesschau_archive');
    let archive = existingData ? JSON.parse(existingData) : [];
    
    const isAlreadyAnalyzed = archive.some((item: any) => item.id === videoId);

    if (isAlreadyAnalyzed) {
      return NextResponse.json({ message: "Kein neues Video gefunden." });
    }

    // KI-ANALYSE
    const prompt = `Analysiere die Tagesschau: "${video.title}". Erstelle eine strukturierte Zusammenfassung in Bullet Points und beschreibe visuelle Besonderheiten des Studios und der Einblendungen. Antworte auf Deutsch.`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    const newEntry = {
      id: videoId,
      title: video.title,
      summary: summary,
      date: new Date().toISOString(),
      url: `https://youtube.com/watch?v=${videoId}`,
      thumbnail: video.thumbnails?.high?.url || video.thumbnails?.default?.url
    };

    // Oben im Archiv einfügen und auf max 10 Einträge begrenzen
    archive.unshift(newEntry);
    archive = archive.slice(0, 10); 
    await redis.set('tagesschau_archive', JSON.stringify(archive));

    // E-MAIL VERSAND via Resend
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Tagesschau Archiv <onboarding@resend.dev>',
        to: 'lbuehrde@hs-mittweida.de',
        subject: `NEU: ${video.title}`,
        text: `Eine neue Zusammenfassung ist verfügbar:\n\n${summary}\n\nLink: ${newEntry.url}`
      })
    });

    return NextResponse.json({ success: true, added: video.title });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
