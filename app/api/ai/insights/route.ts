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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
    });

    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from('session_history')
      .select('*')
      .eq('vapi_call_id', callId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.transcript_source) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 });
    }

    await supabase
      .from('session_history')
      .update({ insights_status: 'pending' })
      .eq('id', session.id);

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an educational assistant. Analyze the tutoring session transcript and extract a summary, key concepts, spaced repetition flashcards, and a multiple-choice quiz.',
        },
        {
          role: 'user',
          content: `Transcript:\n\n${session.transcript_source}`,
        },
      ],
      response_format: zodResponseFormat(InsightsSchema, 'insights'),
    });

    const parsed = completion.choices[0]?.message?.parsed;

    if (!parsed) {
      throw new Error('Failed to parse insights');
    }

    if (parsed.flashcards.length > 0) {
      const cards = parsed.flashcards.map((fc: { front: string; back: string }) => ({
        user_id: session.user_id,
        session_id: session.id,
        companion_id: session.companion_id,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Insights Error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
