'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { reviewCard, ReviewGrade } from '@/lib/srs';

export interface FlashcardRecord {
  id: string;
  created_at: string;
  user_id: string;
  session_id: string | null;
  companion_id: string | null;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
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

export async function getDueFlashcards(): Promise<FlashcardRecord[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .lte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(30);

  if (error) {
    console.warn('Could not load flashcards:', error.message);
    return [];
  }
  return (data || []) as FlashcardRecord[];
}

export async function createFlashcard(
  front: string,
  back: string
): Promise<FlashcardRecord> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id: userId,
      front: front.trim(),
      back: back.trim(),
      due_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create flashcard');
  }
  return data as FlashcardRecord;
}

export async function reviewFlashcard(cardId: string, grade: ReviewGrade) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = getAdminSupabase();

  const { data: card, error: fetchErr } = await supabase
    .from('flashcards')
    .select('interval_days, repetitions, ease_factor, lapses')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (fetchErr || !card) throw new Error('Card not found');

  const nextSrs = reviewCard(
    {
      intervalDays: card.interval_days,
      repetitions: card.repetitions,
      easeFactor: card.ease_factor,
      lapses: card.lapses,
    },
    grade
  );

  const { error: updateErr } = await supabase
    .from('flashcards')
    .update({
      interval_days: nextSrs.intervalDays,
      repetitions: nextSrs.repetitions,
      ease_factor: nextSrs.easeFactor,
      lapses: nextSrs.lapses,
      due_at: nextSrs.dueAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .eq('user_id', userId);

  if (updateErr) throw new Error(updateErr.message);

  return nextSrs;
}

export async function submitQuizAttempt(
  sessionId: string,
  score: number,
  total: number,
  answers: number[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = getAdminSupabase();
  const { error } = await supabase.from('quiz_attempts').insert({
    user_id: userId,
    session_id: sessionId,
    score,
    total,
    answers,
  });

  if (error) {
    console.warn('Quiz attempt insert warning:', error.message);
  }
  return { success: true };
}
