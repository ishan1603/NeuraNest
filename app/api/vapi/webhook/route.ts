import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// This webhook is called by Vapi. We bypass Clerk auth and use the service role key
// because the webhook comes from Vapi's servers, not the user's browser.

export async function POST(req: Request) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );

    const body = await req.json();
    const { message } = body;

    if (message?.type === 'end-of-call-report') {
      const call = message.call;
      const callId = call?.id;
      const endedReason = message.endedReason;
      const cost = message.cost;
      const duration = message.duration;
      const transcript = message.transcript;

      if (!callId) {
        return NextResponse.json({ error: 'Missing call ID' }, { status: 400 });
      }

      const { error } = await supabase
        .from('session_history')
        .update({
          status: 'finalizing',
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          ended_reason: endedReason,
          cost: cost,
          transcript_source: transcript,
        })
        .eq('vapi_call_id', callId);

      if (error) {
        console.error('Webhook Supabase Error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      fetch(new URL('/api/ai/insights', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      }).catch(e => console.error('Failed to trigger insights gen', e));

      return NextResponse.json({ success: true });
    }

    if (message?.type === 'tool-calls') {
      const toolCalls = message.toolCalls || [];
      const results = [];

      for (const call of toolCalls) {
        if (call.function.name === 'search_knowledge_base') {
          const { query, user_id } = call.function.arguments;

          if (!query || !user_id) {
            results.push({
              toolCallId: call.id,
              result: 'Missing query or user_id',
            });
            continue;
          }

          try {
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
            });

            const embRes = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: query,
              dimensions: 1536,
            });
            const queryEmbedding = embRes.data[0].embedding;

            const { data: chunks, error: matchError } = await supabase.rpc(
              'match_document_chunks',
              {
                query_embedding: queryEmbedding as unknown as string,
                p_companion_id:
                  '00000000-0000-0000-0000-000000000000',
                match_count: 5,
                p_user_id: user_id,
              }
            );

            if (matchError) throw matchError;

            const content =
              chunks && chunks.length > 0
                ? chunks.map((c: { content: string }) => c.content).join('\n\n')
                : 'No relevant documents found in your knowledge base.';

            results.push({
              toolCallId: call.id,
              result: content,
            });
          } catch (e: unknown) {
            console.error('Vector search error:', e);
            results.push({
              toolCallId: call.id,
              result: `Error performing search: ${e instanceof Error ? e.message : String(e)}`,
            });
          }
        } else {
          results.push({
            toolCallId: call.id,
            result: `Unknown function ${call.function.name}`,
          });
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({ success: true, ignored: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
