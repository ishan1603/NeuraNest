import FlashcardReview from '@/components/FlashcardReview';

export default function ReviewPage() {
  return (
    <main>
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Spaced Repetition Flashcards
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Powered by the SuperMemo SM-2 algorithm. Cards extracted from your AI tutoring transcripts
          are scheduled at optimal intervals so you retain concepts long-term.
        </p>
      </section>
      <FlashcardReview />
    </main>
  );
}
