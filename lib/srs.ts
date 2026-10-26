/**
 * SM-2 spaced-repetition scheduler (SuperMemo 2, with Anki-style tweaks).
 * Pure function → deterministic & unit tested.
 */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

export interface CardSchedule {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface ReviewResult extends CardSchedule {
  dueAt: Date;
}

export const MIN_EASE = 1.3;
export const RELEARN_MINUTES = 10;
const EASY_BONUS = 1.3;
const HARD_MULTIPLIER = 1.2;

const DAY_MS = 24 * 60 * 60 * 1000;

export function nextEaseFactor(easeFactor: number, quality: number): number {
  const q = Math.max(0, Math.min(5, quality));
  const ef = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(MIN_EASE, Math.round(ef * 100) / 100);
}

export function reviewCard(card: CardSchedule, grade: ReviewGrade, now: Date = new Date()): ReviewResult {
  const quality = GRADE_QUALITY[grade];
  const easeFactor = nextEaseFactor(card.easeFactor, quality);

  // Failed recall: reset the streak and show the card again shortly.
  if (quality < 3) {
    return {
      easeFactor,
      intervalDays: 0,
      repetitions: 0,
      lapses: card.lapses + 1,
      dueAt: new Date(now.getTime() + RELEARN_MINUTES * 60 * 1000),
    };
  }

  const repetitions = card.repetitions + 1;
  let intervalDays: number;

  if (repetitions === 1) {
    intervalDays = grade === 'easy' ? 4 : 1;
  } else if (repetitions === 2) {
    intervalDays = grade === 'hard' ? 3 : 6;
  } else {
    const base = Math.max(1, card.intervalDays);
    const multiplier = grade === 'hard' ? HARD_MULTIPLIER : grade === 'easy' ? easeFactor * EASY_BONUS : easeFactor;
    intervalDays = Math.max(base + 1, Math.round(base * multiplier));
  }

  return {
    easeFactor,
    intervalDays,
    repetitions,
    lapses: card.lapses,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}

/** Human readable preview of when a card would next be shown, e.g. "10m", "6d". */
export function formatInterval(result: ReviewResult, now: Date = new Date()): string {
  const ms = result.dueAt.getTime() - now.getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const days = Math.round(ms / DAY_MS);
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months}mo` : `${Math.round(days / 365)}y`;
}

export function previewIntervals(
  card: CardSchedule,
  now: Date = new Date()
): Record<ReviewGrade, string> {
  return {
    again: formatInterval(reviewCard(card, 'again', now), now),
    hard: formatInterval(reviewCard(card, 'hard', now), now),
    good: formatInterval(reviewCard(card, 'good', now), now),
    easy: formatInterval(reviewCard(card, 'easy', now), now),
  };
}
