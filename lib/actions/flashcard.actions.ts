'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { calculateNextReview } from '@/lib/srs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getDueFlashcards() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review', now)
    .order('next_review', { ascending: true })
    .limit(20);

  if (error) throw new Error(error.message);
  return data;
}

export async function reviewFlashcard(cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // get current card
  const { data: card, error: fetchErr } = await supabase
    .from('flashcards')
    .select('interval, repetition, ease_factor')
    .eq('id', cardId)
    .single();
    
  if (fetchErr || !card) throw new Error('Card not found');

  const srsData = {
    interval: card.interval,
    repetition: card.repetition,
    easeFactor: card.ease_factor
  };

  const nextSrs = calculateNextReview(quality, srsData);

  const { error: updateErr } = await supabase
    .from('flashcards')
    .update({
      interval: nextSrs.interval,
      repetition: nextSrs.repetition,
      ease_factor: nextSrs.easeFactor,
      next_review: nextSrs.nextReviewDate.toISOString(),
      last_reviewed: new Date().toISOString()
    })
    .eq('id', cardId);

  if (updateErr) throw new Error(updateErr.message);
  
  return true;
}
