'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createKnowledgeBase(title: string, description: string = '') {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('knowledge_bases')
    .insert({ user_id: userId, title, description })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getKnowledgeBases() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('knowledge_bases')
    .select(`
      *,
      documents (
        id, title, processed, created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteKnowledgeBase(kbId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('knowledge_bases')
    .delete()
    .eq('id', kbId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return true;
}

