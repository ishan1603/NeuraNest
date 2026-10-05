import KnowledgeBaseManager from '@/components/KnowledgeBaseManager';

export default function KnowledgePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">My Knowledge Base</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Upload your notes, textbooks, and resources. Your AI companions will use these to teach you and test your knowledge.
      </p>
      <KnowledgeBaseManager />
    </div>
  );
}
