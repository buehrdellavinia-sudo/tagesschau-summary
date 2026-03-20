import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log("--- START: Cron Job läuft an ---");
  
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Fehler: Unauthorized");
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const redis = new Redis(process.env.REDIS_URL || '');
    console.log("1. Redis verbunden");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    console.log("2. Gemini bereit");

    const playlistId = 'PL4A2F331EE86DCC22';
    const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`;
    
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();
    
    if (!ytData.items || ytData.items.length === 0) {
      throw new Error("YouTube hat keine Daten geliefert");
    }

    const video = ytData.items[0].snippet;
    const videoId = video.resourceId.videoId;
    console.log("3. YouTube Video gefunden:", video.title);

    // Archiv-Logik
    const existingData = await redis.get('tagesschau_archive');
    let archive = [];
    try {
      archive = existingData ? JSON.parse(existingData) : [];
    } catch (e) {
      console.log("Hinweis: Archiv war kein gültiges JSON, starte neu.");
      archive = [];
    }

    const isAlreadyAnalyzed = archive.some((item: any) => item.id === videoId);
    if (isAlreadyAnalyzed) {
      console.log("4. Video bereits im Archiv. Ende.");
      return NextResponse.json({ message: "Bereits aktuell" });
    }

    console.log("5. Starte KI-Analyse...");
    const prompt = `Analysiere die Tagesschau vom ${new Date().toLocaleDateString('de-DE')}: "${video.title}". Fasse die Themen zusammen und beschreibe das Studio-Design. Antworte als sachlicher Nachrichten-Analyst auf Deutsch.`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    console.log("6. KI-Analyse fertig");

    const newEntry = {
      id: videoId,
      title: video.title,
      summary: summary,
      date: new Date().toISOString(),
      url: `https://youtube.com/watch?v=${videoId}`,
      thumbnail: video.thumbnails?.high?.url || video.thumbnails?.default?.url
    };

    archive.unshift(newEntry);
    archive = archive.slice(0, 10);
    await redis.set('tagesschau_archive', JSON.stringify(archive));
    console.log("7. In Redis gespeichert");

    console.log("8. Sende E-Mail...");
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Tagesschau <onboarding@resend.dev>',
        to: 'lbuehrde@hs-mittweida.de',
        subject: `Tagesschau News: ${video.title}`,
        text: summary
      })
    });
    
    if (emailRes.ok) {
      console.log("9. E-Mail erfolgreich versendet!");
    } else {
      console.error("Fehler beim E-Mail-Versand");
    }

    console.log("--- FINISH: Erfolg! ---");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("ABBRUCH Fehler:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
