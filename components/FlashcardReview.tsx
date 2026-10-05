'use client';

import { useState, useEffect } from 'react';
import { getDueFlashcards, reviewFlashcard } from '@/lib/actions/flashcard.actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FlashcardReview() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const data = await getDueFlashcards();
      setCards(data);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (e: any) {
      toast.error('Failed to load flashcards: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (cards.length === 0) return;
    const card = cards[currentIndex];
    try {
      await reviewFlashcard(card.id, quality);
      
      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // Done with this batch
        setCards([]);
        toast.success("You're all caught up for now!");
      }
    } catch (e: any) {
      toast.error('Failed to review: ' + e.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-2xl bg-card">
        <h2 className="text-2xl font-bold mb-4">No reviews pending</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You've reviewed all your due flashcards! Have some more AI sessions to generate new ones.
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl min-h-[300px] border rounded-3xl p-8 bg-card shadow-sm flex flex-col justify-center text-center transition-all duration-300">
        <h3 className="text-2xl font-semibold mb-6">{currentCard.front}</h3>
        
        {showAnswer ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full h-[1px] bg-border my-6" />
            <p className="text-xl text-muted-foreground">{currentCard.back}</p>
          </div>
        ) : (
          <button 
            onClick={() => setShowAnswer(true)}
            className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity self-center"
          >
            Show Answer
          </button>
        )}
      </div>

      {showAnswer && (
        <div className="flex gap-2 mt-8 flex-wrap justify-center animate-in slide-in-from-bottom-4">
          <button onClick={() => handleReview(0)} className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50">
            Blackout (0)
          </button>
          <button onClick={() => handleReview(1)} className="px-4 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50">
            Wrong (1)
          </button>
          <button onClick={() => handleReview(2)} className="px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50">
            Hard (2)
          </button>
          <button onClick={() => handleReview(3)} className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
            Good (3)
          </button>
          <button onClick={() => handleReview(4)} className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50">
            Easy (4)
          </button>
          <button onClick={() => handleReview(5)} className="px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50">
            Perfect (5)
          </button>
        </div>
      )}
      
      <p className="mt-8 text-sm text-muted-foreground">
        Card {currentIndex + 1} of {cards.length}
      </p>
    </div>
  );
}

