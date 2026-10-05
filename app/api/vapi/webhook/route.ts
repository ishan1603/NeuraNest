import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// This webhook is called by Vapi. We bypass Clerk auth and use the service role key
// because the webhook comes from Vapi's servers, not the user's browser.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
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

      // Update the session history
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

      // We should trigger the insights generation in the background.
      // We can use a fetch call to a separate route handler to not block the webhook.
      fetch(new URL('/api/ai/insights', req.url).toString(), {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ callId }),
      }).catch(e => console.error('Failed to trigger insights gen', e));

      return NextResponse.json({ success: true });
    }

    if (message?.type === 'tool-calls') {
      const toolCalls = message.toolCalls;
      const results = [];

      for (const call of toolCalls) {
        if (call.function.name === 'search_knowledge_base') {
          const { query, user_id } = call.function.arguments;
          
          if (!query || !user_id) {
             results.push({
               toolCallId: call.id,
               result: "Missing query or user_id",
             });
             continue;
          }

          try {
            // Generate embedding for query
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            const embRes = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: query,
              dimensions: 1536,
            });
            const queryEmbedding = embRes.data[0].embedding;

            // Search supabase
            const { data: chunks, error: matchError } = await supabase.rpc('match_document_chunks', {
              query_embedding: queryEmbedding,
              match_threshold: 0.5,
              match_count: 5,
              p_user_id: user_id
            });

            if (matchError) throw matchError;

            const content = chunks && chunks.length > 0 
              ? chunks.map((c: any) => c.content).join('\n\n')
              : "No relevant documents found in your knowledge base.";

            results.push({
              toolCallId: call.id,
              result: content,
            });
          } catch (e: any) {
            console.error('Vector search error:', e);
            results.push({
              toolCallId: call.id,
              result: `Error performing search: ${e.message}`,
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
