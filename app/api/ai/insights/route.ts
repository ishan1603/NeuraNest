import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/supabase';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const InsightsSchema = z.object({
  summary: z.string(),
  key_concepts: z.array(z.string()),
  flashcards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correct_option_index: z.number(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );

    const gemini = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });

    const body = await req.json();
    const {
      callId,
      companionId,
      userId,
      transcript: clientTranscript,
      durationSeconds,
    } = body as {
      callId?: string;
      companionId?: string;
      userId?: string;
      transcript?: string;
      durationSeconds?: number;
    };

    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    let { data: session } = await supabase
      .from('session_history')
      .select('*')
      .eq('vapi_call_id', callId)
      .maybeSingle();

    if (!session && companionId && userId) {
      const { data: created } = await supabase
        .from('session_history')
        .insert({
          companion_id: companionId,
          user_id: userId,
          vapi_call_id: callId,
          status: 'finalizing',
          duration_seconds: durationSeconds || 60,
          ended_at: new Date().toISOString(),
          transcript_source: clientTranscript || null,
        })
        .select('*')
        .single();
      session = created;
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const transcriptText = session.transcript_source || clientTranscript;

    if (!transcriptText || transcriptText.trim().length === 0) {
      await supabase
        .from('session_history')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds ?? session.duration_seconds ?? 30,
        })
        .eq('id', session.id);
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 });
    }

    await supabase
      .from('session_history')
      .update({
        insights_status: 'pending',
        transcript_source: transcriptText,
        duration_seconds: durationSeconds ?? session.duration_seconds ?? 60,
        ended_at: session.ended_at || new Date().toISOString(),
      })
      .eq('id', session.id);

    const completion = await gemini.chat.completions.parse({
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert educational assistant. Analyze the tutoring session transcript and extract a concise study summary, 3-6 key concepts, 3-5 high-yield spaced repetition flashcards (front question, back concise answer), and a 3-question multiple-choice quiz (4 options each, 0-based correct_option_index).',
        },
        {
          role: 'user',
          content: `Transcript:\n\n${transcriptText}`,
        },
      ],
      response_format: zodResponseFormat(InsightsSchema, 'insights'),
    });

    const parsed = completion.choices[0]?.message?.parsed;

    if (!parsed) {
      throw new Error('Failed to parse insights from Gemini');
    }

    if (parsed.flashcards.length > 0) {
      const cards = parsed.flashcards.map((fc: { front: string; back: string }) => ({
        user_id: session!.user_id,
        session_id: session!.id,
        companion_id: session!.companion_id,
        front: fc.front,
        back: fc.back,
      }));
      await supabase.from('flashcards').insert(cards);
    }

    await supabase
      .from('session_history')
      .update({
        status: 'completed',
        insights_status: 'ready',
        insights: parsed as unknown as Json,
      })
      .eq('id', session.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      insights: parsed,
    });
  } catch (error) {
    console.error('Insights Error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
