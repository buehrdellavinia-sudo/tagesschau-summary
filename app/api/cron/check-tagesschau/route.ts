import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // DIAGNOSE START
    if (!process.env.REDIS_URL) return NextResponse.json({ e: "REDIS_URL fehlt" });
    if (!process.env.YOUTUBE_API_KEY) return NextResponse.json({ e: "YOUTUBE_API_KEY fehlt" });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ e: "GEMINI_API_KEY fehlt" });

    const redis = new Redis(process.env.REDIS_URL);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // YouTube Test
    const playlistId = 'PL4A2F331EE86DCC22';
    const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`);
    const ytData = await ytRes.json();
    
    if (ytData.error) return NextResponse.json({ e: "YouTube Fehler", msg: ytData.error.message });

    const video = ytData.items[0].snippet;
    
    // Gemini Test
    const result = await model.generateContent("Hallo, antworte mit 'KI bereit'.");
    const aiTest = result.response.text();

    return NextResponse.json({ 
      status: "Soweit alles okay!", 
      videoGefunden: video.title,
      kiAntwort: aiTest 
    });

  } catch (error: any) {
    // Wenn irgendwo ein Fehler passiert, schreiben wir ihn direkt auf den Bildschirm!
    return NextResponse.json({ 
      status: "FEHLER GEFUNDEN!",
      meldung: error.message,
      code: error.code
    });
  }
}
