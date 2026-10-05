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
    const file = formData.get('file') as File;
    const kbId = formData.get('kbId') as string;
    const title = formData.get('title') as string || file?.name || 'Untitled Document';

    if (!file || !kbId) {
      return NextResponse.json({ error: 'Missing file or knowledge base ID' }, { status: 400 });
    }

    // Process PDF
    const buffer = await file.arrayBuffer();
    const text = await parsePdf(buffer);

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text could be extracted from this PDF.' }, { status: 400 });
    }

    // Chunk text
    const chunks = chunkText(text, 1000, 200);

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Init Supabase admin client to bypass RLS for quick server-side insert, or pass user context
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        kb_id: kbId,
        title: title,
        file_type: 'pdf',
        processed: true
      })
      .select('id')
      .single();

    if (docError || !document) {
      console.error('Error creating document record:', docError);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    // 2. Insert chunks with embeddings
    const chunkRows = chunks.map((chunk, index) => ({
      document_id: document.id,
      content: chunk,
      embedding: embeddings[index],
    }));

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRows);

    if (chunksError) {
      console.error('Error inserting chunks:', chunksError);
      return NextResponse.json({ error: 'Failed to save document chunks' }, { status: 500 });
    }

    return NextResponse.json({ success: true, documentId: document.id, chunks: chunks.length });
  } catch (error) {
    console.error('RAG Error:', error);
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
  }
}
