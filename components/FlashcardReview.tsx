'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDueFlashcards,
  reviewFlashcard,
  createFlashcard,
  type FlashcardRecord,
} from '@/lib/actions/flashcard.actions';
import { previewIntervals, type ReviewGrade } from '@/lib/srs';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Brain,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';

const GRADE_STYLES: Record<ReviewGrade, string> = {
  again:
    'border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-300',
  hard: 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300',
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300',
  easy: 'border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300',
};

interface FlashcardReviewProps {
  initialCards?: FlashcardRecord[];
}

export default function FlashcardReview({ initialCards }: FlashcardReviewProps) {
  const [cards, setCards] = useState<FlashcardRecord[]>(initialCards ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(initialCards === undefined);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [frontInput, setFrontInput] = useState('');
  const [backInput, setBackInput] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDueFlashcards();
      setCards(data);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (e: unknown) {
      toast.error(
        'Failed to load flashcards: ' + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCards === undefined) {
      fetchCards();
    }
  }, [initialCards, fetchCards]);

  const currentCard = cards[currentIndex];

  const handleGrade = useCallback(
    async (grade: ReviewGrade) => {
      if (!currentCard || submitting) return;
      setSubmitting(true);
      try {
        await reviewFlashcard(currentCard.id, grade);
        setFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } catch (e: unknown) {
        toast.error(
          'Failed to save review: ' + (e instanceof Error ? e.message : String(e))
        );
      } finally {
        setSubmitting(false);
      }
    },
    [currentCard, submitting]
  );

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontInput.trim() || !backInput.trim()) {
      toast.error('Please enter both a front question and back answer');
      return;
    }
    setCreating(true);
    try {
      const newCard = await createFlashcard(frontInput, backInput);
      setCards(prev => [...prev, newCard]);
      setFrontInput('');
      setBackInput('');
      setShowCreateForm(false);
      toast.success('Flashcard added to your SM-2 review deck!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showCreateForm) return;
      if (!currentCard || submitting) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped(f => !f);
      } else if (flipped) {
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentCard, flipped, submitting, showCreateForm, handleGrade]);

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Brain className="h-3.5 w-3.5" />
          <span>SuperMemo SM-2 Deck ({ Math.max(0, cards.length - currentIndex) } due)</span>
        </span>
        <button
          type="button"
          onClick={() => setShowCreateForm(prev => !prev)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-accent"
        >
          {showCreateForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{showCreateForm ? 'Close' : 'Add Custom Card'}</span>
        </button>
      </div>

      {/* Custom Flashcard Creator */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateCard}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <h3 className="text-base font-bold">Create Custom Flashcard</h3>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Front (Question / Prompt)
            </label>
            <input
              type="text"
              value={frontInput}
              onChange={e => setFrontInput(e.target.value)}
              placeholder="e.g., What is the time complexity of HNSW vector search?"
              className="input bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Back (Answer / Explanation)
            </label>
            <textarea
              rows={3}
              value={backInput}
              onChange={e => setBackInput(e.target.value)}
              placeholder="e.g., O(log N) approximate nearest neighbor search via hierarchical navigable small world graphs."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary px-5 py-2 text-xs"
            >
              {creating ? 'Saving...' : 'Save Flashcard'}
            </button>
          </div>
        </form>
      )}

      {cards.length === 0 || currentIndex >= cards.length ? (
        <div className="mx-auto flex w-full flex-col items-center gap-4 rounded-3xl border border-border bg-card p-12 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">All caught up!</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            You have reviewed all flashcards due right now. Complete a voice tutoring session to
            automatically generate new cards with Gemini 2.5 Flash, or add custom cards above.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/companions" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              <span>Start a Voice Session</span>
            </Link>
            <button
              type="button"
              onClick={fetchCards}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground tabular-nums">
            <span>
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span>Ease {(currentCard.ease_factor || 2.5).toFixed(2)}x</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200 ease-[var(--ease-out)]"
              style={{
                width: `${Math.round(((currentIndex + 1) / cards.length) * 100)}%`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-xs transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.99]"
          >
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
              {flipped ? 'Answer' : 'Prompt'}
            </span>
            <p className="max-w-xl text-xl leading-relaxed font-semibold md:text-2xl">
              {flipped ? currentCard.back : currentCard.front}
            </p>
            {!flipped && (
              <span className="mt-4 text-xs text-muted-foreground">
                Click card or press{' '}
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">Space</kbd> to
                reveal answer
              </span>
            )}
          </button>

          {flipped && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['again', 'hard', 'good', 'easy'] as ReviewGrade[]).map((grade, idx) => {
                const intervals = previewIntervals({
                  intervalDays: currentCard.interval_days,
                  repetitions: currentCard.repetitions,
                  easeFactor: currentCard.ease_factor,
                  lapses: currentCard.lapses,
                });
                return (
                  <button
                    key={grade}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleGrade(grade)}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border p-3.5 font-semibold capitalize transition-transform duration-150 active:scale-[0.97] ${GRADE_STYLES[grade]}`}
                  >
                    <span className="text-sm font-bold">{grade}</span>
                    <span className="text-xs opacity-80 tabular-nums">
                      {intervals[grade]} · [{idx + 1}]
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
