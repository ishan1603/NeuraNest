'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

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

const getAdminSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'dummy_key'
  );

export async function getDocuments(): Promise<DocumentRecord[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

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
