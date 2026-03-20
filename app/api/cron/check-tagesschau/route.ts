import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const redis = new Redis(process.env.REDIS_URL || '');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const playlistId = 'PL4A2F331EE86DCC22';
    const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`;
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();
    const video = ytData.items[0].snippet;

    const result = await model.generateContent(`Fasse die Themen dieser Tagesschau zusammen: "${video.title}". Antworte auf Deutsch.`);
    const summary = result.response.text();

    const data = { title: video.title, summary: summary, date: new Date().toISOString() };
    await redis.set('latest_summary', JSON.stringify(data));

    return NextResponse.json({ status: "Erfolg!", video: video.title });
  } catch (e: any) {
    return NextResponse.json({ status: "Fehler", info: e.message }, { status: 500 });
  }
}
