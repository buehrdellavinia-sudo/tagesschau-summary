import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Authentifizierung prüfen
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Falsches CRON_SECRET" }, { status: 401 });
    }

    // 2. Verbindungstest Redis
    if (!process.env.REDIS_URL) throw new Error("REDIS_URL fehlt in Vercel");
    const redis = new Redis(process.env.REDIS_URL);

    // 3. YouTube Abruf
    if (!process.env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY fehlt");
    const playlistId = 'PL4A2F331EE86DCC22';
    const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`;
    
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();
    
    if (ytData.error) throw new Error("YouTube API Fehler: " + ytData.error.message);
    const video = ytData.items[0].snippet;
    const videoId = video.resourceId.videoId;

    // 4. Gemini Analyse
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY fehlt");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Wir nehmen hier 1.5-flash, weil es das stabilste Modell ist. 
    // Falls das wieder 404 wirft, ändern wir es auf gemini-2.0-flash-exp oder 1.5-flash-latest
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `Fasse die Themen dieser Tagesschau zusammen: "${video.title}". Beschreibe das Studio. Deutsch antworten.`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // 5. Speichern
    const existingData = await redis.get('tagesschau_archive');
    let archive = existingData ? JSON.parse(existingData) : [];
    
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

    // 6. E-Mail (optionaler Teil, falls Resend hakt, soll der Rest trotzdem gehen)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Tagesschau <onboarding@resend.dev>',
          to: 'lbuehrde@hs-mittweida.de',
          subject: `Neu: ${video.title}`,
          text: summary
        })
      });
    } catch (e) {
      console.error("E-Mail Fehler ignoriert");
    }

    return NextResponse.json({ success: true, title: video.title });

  } catch (error: any) {
    // DAS IST WICHTIG: Wir geben den Fehler als Antwort zurück!
    return NextResponse.json({ 
      error: "Bauernschlau-Diagnose: " + error.message,
      stack: error.stack?.substring(0, 100) 
    }, { status: 500 });
  }
}
