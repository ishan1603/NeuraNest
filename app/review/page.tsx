import FlashcardReview from '@/components/FlashcardReview';

export default function ReviewPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Flashcard Review</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Review key concepts generated from your AI companion sessions. We use spaced repetition to help you remember longer.
      </p>
      <FlashcardReview />
    </div>
  );
}

