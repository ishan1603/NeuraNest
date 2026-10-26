'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { embedQuery } from '@/lib/rag';

export interface DocumentRecord {
  id: string;
  created_at: string;
  user_id: string;
  companion_id: string | null;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  chunk_count: number;
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
}

export interface RetrievedChunkProof {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

const getAdminSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'dummy_key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

export async function getDocuments(): Promise<DocumentRecord[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Could not load documents:', error.message);
    return [];
  }
  return (data || []) as DocumentRecord[];
}

export async function deleteDocument(docId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', docId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return true;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function retrieveDocumentContext({
  documentId,
  query,
  limit = 4,
}: {
  documentId?: string | null;
  query: string;
  limit?: number;
}): Promise<RetrievedChunkProof[]> {
  const { userId } = await auth();
  if (!userId || documentId === 'none') return [];

  const supabase = getAdminSupabase();

  // Fetch user's documents lookup map
  const { data: docsData } = await supabase
    .from('documents')
    .select('id, name')
    .eq('user_id', userId);

  const docNameMap = new Map<string, string>();
  for (const d of docsData || []) {
    docNameMap.set(d.id, d.name);
  }

  let chunksQuery = supabase
    .from('document_chunks')
    .select('id, document_id, chunk_index, content, embedding')
    .eq('user_id', userId);

  if (documentId && documentId !== 'all') {
    chunksQuery = chunksQuery.eq('document_id', documentId);
  }

  const { data: rawChunks, error } = await chunksQuery.limit(120);
  if (error || !rawChunks || rawChunks.length === 0) {
    return [];
  }

  const queryVec = await embedQuery(query);

  const scored = rawChunks.map(row => {
    let vec: number[] = [];
    try {
      vec =
        typeof row.embedding === 'string'
          ? JSON.parse(row.embedding)
          : Array.isArray(row.embedding)
            ? row.embedding
            : [];
    } catch {
      vec = [];
    }
    const sim = vec.length > 0 ? cosineSimilarity(queryVec, vec) : 0.75;
    return {
      id: row.id as string,
      documentId: row.document_id as string,
      documentName: docNameMap.get(row.document_id as string) || 'Uploaded PDF',
      chunkIndex: (row.chunk_index as number) ?? 0,
      content: row.content as string,
      similarity: Math.max(0.5, Math.min(0.99, Number(sim.toFixed(3)))),
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}
