import { NextRequest, NextResponse } from 'next/server';
import { parsePdf, chunkText, generateEmbeddings } from '@/lib/rag';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const companionId = (formData.get('companionId') as string | null) || null;
    const title = (formData.get('title') as string) || file?.name || 'Untitled Document';

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = await parsePdf(buffer);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No selectable text could be extracted from this PDF.' },
        { status: 400 }
      );
    }

    // Scale chunk size dynamically so even large textbooks stay under ~45 chunks
    // (fits within Gemini embedding context window and stays well under the 100/min free-tier quota)
    const dynamicChunkSize = Math.max(1800, Math.ceil(text.length / 40));
    const chunks = chunkText(text, dynamicChunkSize, 250);
    const embeddings = await generateEmbeddings(chunks);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        companion_id: companionId,
        name: title,
        mime_type: file.type || 'application/pdf',
        size_bytes: file.size || 0,
        chunk_count: chunks.length,
        status: 'ready',
      })
      .select('*')
      .single();

    if (docError || !document) {
      console.error('Error creating document record:', docError);
      return NextResponse.json(
        { error: docError?.message || 'Failed to create document record' },
        { status: 500 }
      );
    }

    const chunkRows = chunks.map((chunk, index) => ({
      document_id: document.id,
      user_id: userId,
      companion_id: companionId,
      chunk_index: index,
      content: chunk,
      embedding: JSON.stringify(embeddings[index]),
    }));

    const { error: chunksError } = await supabase.from('document_chunks').insert(chunkRows);

    if (chunksError) {
      console.error('Error inserting chunks:', chunksError);
      await supabase
        .from('documents')
        .update({ status: 'failed', error: chunksError.message })
        .eq('id', document.id);
      return NextResponse.json(
        { error: chunksError.message || 'Failed to save document chunks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document,
      documentId: document.id,
      chunks: chunks.length,
    });
  } catch (error) {
    console.error('RAG Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process document' },
      { status: 500 }
    );
  }
}
