import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Resend } from 'resend';
import { GoogleGenAI } from '@google/genai';
import { kv } from '@vercel/kv';

export const maxDuration = 60; // Max allowed for Vercel Hobby/Pro timeout
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized - Invalid CRON_SECRET', { status: 401 });
  }

  try {
    // 1. YouTube Fetch latest video from Playlist
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    
    const response = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: 'PL4A2F331EE86DCC22',
      maxResults: 1
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No video found' }, { status: 404 });
    }

    const latestVideo = items[0].snippet;
    const videoId = latestVideo?.resourceId?.videoId;
    const videoTitle = latestVideo?.title;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // 2. Gemini Analyse
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    
    const prompt = `Analysiere das folgende aktuelle Tagesschau-Video: "${videoTitle}" (URL: ${videoUrl}).
Erstelle eine detaillierte Zusammenfassung der behandelten Themen.
Erstelle ZUDEM eine visuelle Beschreibung der Folge (wer spricht, Mimik, Einblendungen, grafische Darstellungen, Besonderheiten).
Sollte der direkte Videoabruf nicht komplett möglich sein, ziehe die wichtigsten Informationen aus Titel und bekanntem Kontext und beschreibe das typische visuelle Format der Tagesschau für die jeweiligen Elemente.
Achte darauf, dass die Zusammenfassung professionell und präzise ist.`;

    const chatResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [prompt],
    });

    const summaryText = chatResponse.text;

    // 3. Save to Vercel KV Database (for frontend display)
    let saved = false;
    try {
      const entry = {
        id: videoId,
        date: new Date().toISOString(),
        title: videoTitle,
        url: videoUrl,
        summary: summaryText
      };
      // Push newest to the start of the list
      await kv.lpush('tagesschau_summaries', entry);
      await kv.ltrim('tagesschau_summaries', 0, 29); // keep the last 30 summaries
      saved = true;
    } catch (dbError) {
      console.warn('Vercel KV Database not configured or error:', dbError);
    }

    // 4. Send Email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Tagesschau Summary App <onboarding@resend.dev>',
      to: 'lbuehrde@hs-mittweida.de',
      subject: `Tagesschau Zusammenfassung: ${videoTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Tagesschau Summary</h1>
          <h2>${videoTitle}</h2>
          <p><a href="${videoUrl}" style="background: #2563eb; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">Video auf YouTube ansehen</a></p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 24px 0;" />
          <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${summaryText}</div>
        </div>
      `
    });

    return NextResponse.json({ success: true, videoId, saved, emailSent: true });

  } catch (error: any) {
    console.error('Error in check-tagesschau:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
