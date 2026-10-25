'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { computeGamification, type GamificationSummary } from '@/lib/gamification';

const getAdminSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'dummy_key'
  );

export async function getUserGamificationProfile(): Promise<GamificationSummary> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = getAdminSupabase();

  const [sessionsRes, quizzesRes, reviewRes, companionsRes] = await Promise.all([
    supabase
      .from('session_history')
      .select('created_at, duration_seconds, companions:companion_id (subject)')
      .eq('user_id', userId),
    supabase.from('quiz_attempts').select('score, total, created_at').eq('user_id', userId),
    supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('last_reviewed_at', 'is', null),
    supabase
      .from('companions')
      .select('*', { count: 'exact', head: true })
      .eq('author', userId),
  ]);

  const mappedSessions = (sessionsRes.data || []).map(s => {
    const companionRel = s.companions as { subject?: string } | { subject?: string }[] | null;
    const subject = Array.isArray(companionRel)
      ? companionRel[0]?.subject
      : companionRel?.subject;
    return {
      createdAt: s.created_at,
      durationSeconds: s.duration_seconds ?? 900,
      subject: subject ?? null,
    };
  });

  const mappedQuizzes = (quizzesRes.data || []).map(q => ({
    score: q.score,
    total: q.total,
    createdAt: q.created_at,
  }));

  return computeGamification({
    sessions: mappedSessions,
    quizzes: mappedQuizzes,
    reviewCount: reviewRes.count || 0,
    companionsCreated: companionsRes.count || 0,
  });
}
