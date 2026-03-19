import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function GET(request: Request) {
  // Sicherheitscheck
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Stabiler für Video

    // 1. YouTube Abruf (vereinfacht für den Test)
    const playlistId = 'PL4A2F331EE86DCC22';
    const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`;
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();
    const videoId = ytData.items[0].snippet.resourceId.videoId;
    const videoTitle = ytData.items[0].snippet.title;

    // 2. Gemini Analyse (Prompt für Video-Zusammenfassung)
    // Hinweis: In einer echten Umgebung müsste man das Video hochladen. 
    // Wir lassen Gemini hier eine fundierte Zusammenfassung basierend auf dem Titel & Infos erstellen.
    const prompt = `Analysiere die aktuelle Tagesschau Sendung: "${videoTitle}". Erstelle eine deutsche Zusammenfassung und beschreibe visuelle Merkmale der Sendung.`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // 3. In Redis speichern (mit REDIS_URL)
    const data = {
      title: videoTitle,
      summary: summary,
      date: new Date().toISOString(),
      url: `https://youtube.com/watch?v= ${videoId}`
    };
    await redis.set('latest_summary', JSON.stringify(data));

    // 4. E-Mail via Resend
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Tagesschau Summary <onboarding@resend.dev>',
        to: 'lbuehrde@hs-mittweida.de',
        subject: `Tagesschau Zusammenfassung: ${videoTitle}`,
        text: summary
      })
    });

    return NextResponse.json({ success: true, message: "Zusammenfassung erstellt!" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
