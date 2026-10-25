'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDueFlashcards,
  reviewFlashcard,
  type FlashcardRecord,
} from '@/lib/actions/flashcard.actions';
import { formatInterval, reviewCard, type ReviewGrade } from '@/lib/srs';
import { toast } from 'sonner';
import { CheckCircle2, Eye, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const GRADES: {
  grade: ReviewGrade;
  label: string;
  keyHint: string;
  className: string;
}[] = [
  {
    grade: 'again',
    label: 'Again',
    keyHint: '1',
    className:
      'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  },
  {
    grade: 'hard',
    label: 'Hard',
    keyHint: '2',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    grade: 'good',
    label: 'Good',
    keyHint: '3',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    grade: 'easy',
    label: 'Easy',
    keyHint: '4',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
];

export default function FlashcardReview() {
  const [cards, setCards] = useState<FlashcardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const data = await getDueFlashcards();
      setCards(data);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (e: unknown) {
      const err = e as Error;
      toast.error('Failed to load flashcards: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleReview = useCallback(
    async (grade: ReviewGrade) => {
      if (cards.length === 0) return;
      const card = cards[currentIndex];
      if (!card) return;

      try {
        await reviewFlashcard(card.id, grade);

        if (currentIndex < cards.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowAnswer(false);
        } else {
          setCards([]);
          toast.success("You're all caught up for now!");
        }
      } catch (e: unknown) {
        const err = e as Error;
        toast.error('Failed to record review: ' + err.message);
      }
    },
    [cards, currentIndex]
  );

  // Instant keyboard shortcuts (no animation delay on keyboard actions per Emil Kowalski's framework)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (cards.length === 0) return;
      if (e.code === 'Space' && !showAnswer) {
        e.preventDefault();
        setShowAnswer(true);
      } else if (showAnswer) {
        if (e.key === '1') handleReview('again');
        if (e.key === '2') handleReview('hard');
        if (e.key === '3') handleReview('good');
        if (e.key === '4') handleReview('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cards.length, showAnswer, handleReview]);

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">All caught up!</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          You have no flashcards due right now. Complete a voice tutoring session and our AI will
          automatically extract new SM-2 spaced repetition flashcards for you.
        </p>
        <Link href="/companions" className="mt-6">
          <button type="button" className="btn-primary">
            <Sparkles className="h-4 w-4" />
            <span>Start a Tutoring Session</span>
          </button>
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const schedule = {
    easeFactor: currentCard.ease_factor ?? 2.5,
    intervalDays: currentCard.interval_days ?? 0,
    repetitions: currentCard.repetitions ?? 0,
    lapses: currentCard.lapses ?? 0,
  };
  const progressPct = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between gap-4">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <div className="h-1.5 flex-grow overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-[var(--ease-out)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Ease {schedule.easeFactor.toFixed(2)}x
        </span>
      </div>

      <div className="flex min-h-[300px] w-full flex-col justify-between rounded-3xl border border-border bg-card p-8 text-center shadow-xs md:p-10">
        <div className="my-auto space-y-6">
          <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Prompt
          </span>
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{currentCard.front}</h3>

          {showAnswer && (
            <div className="border-t border-border pt-6">
              <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Answer
              </span>
              <p className="text-lg leading-relaxed text-foreground/90 md:text-xl">
                {currentCard.back}
              </p>
            </div>
          )}
        </div>

        {!showAnswer && (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="btn-primary mx-auto mt-6 px-6 py-3"
          >
            <Eye className="h-4 w-4" />
            <span>Show Answer</span>
            <kbd className="ml-1 rounded bg-black/20 px-1.5 py-0.5 text-xs">Space</kbd>
          </button>
        )}
      </div>

      {showAnswer && (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {GRADES.map(({ grade, label, keyHint, className }) => {
            const preview = formatInterval(reviewCard(schedule, grade));
            return (
              <button
                key={grade}
                type="button"
                onClick={() => handleReview(grade)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3 font-semibold ${className}`}
              >
                <div className="flex items-center gap-1.5 text-sm">
                  <span>{label}</span>
                  <kbd className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                    {keyHint}
                  </kbd>
                </div>
                <span className="text-xs font-normal opacity-80">in {preview}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
