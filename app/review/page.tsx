import FlashcardReview from '@/components/FlashcardReview';
import { getDueFlashcards } from '@/lib/actions/flashcard.actions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ReviewPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const initialCards = await getDueFlashcards();

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
      <FlashcardReview initialCards={initialCards} />
    </main>
  );
}
