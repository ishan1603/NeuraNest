import KnowledgeBaseManager from '@/components/KnowledgeBaseManager';
import { getDocuments } from '@/lib/actions/knowledge.actions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function KnowledgePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const initialDocs = await getDocuments();

  return (
    <main>
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">RAG Knowledge Base</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Upload your course notes, research papers, and PDFs. During any live voice session, ask
          your AI companion about your notes and it will perform real-time semantic vector search.
        </p>
      </section>
      <KnowledgeBaseManager initialDocs={initialDocs} />
    </main>
  );
}
