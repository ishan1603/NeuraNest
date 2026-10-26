import CompanionComponent from '@/components/CompanionComponent';
import { getCompanion } from '@/lib/actions/companion.actions';
import { getDocuments } from '@/lib/actions/knowledge.actions';
import { getSubjectColor } from '@/lib/utils';
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import { redirect } from 'next/navigation';

interface CompanionSessionPageProps {
  params: Promise<{ id: string }>;
}

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {
  const { id } = await params;
  const [companion, user, userDocuments] = await Promise.all([
    getCompanion(id),
    currentUser(),
    getDocuments(),
  ]);

  if (!user) redirect('/sign-in');
  if (!companion || !companion.name) redirect('/companions');

  const { name, subject, topic, duration } = companion;
  return (
    <main>
      <article className="rounded-border flex items-center justify-between bg-card p-6 shadow-xs max-md:flex-col max-md:items-start max-md:gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className="flex size-16 items-center justify-center rounded-2xl border border-black/10 max-md:hidden"
            style={{ backgroundColor: getSubjectColor(subject) }}
          >
            <Image src={`/icons/${subject}.svg`} alt={subject} width={34} height={34} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
              <div className="subject-badge">{subject}</div>
            </div>
            <p className="text-sm text-muted-foreground md:text-base">{topic}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-muted/50 px-3.5 py-1.5 font-mono text-sm font-bold max-md:self-start">
          ⏱ {duration} min session
        </div>
      </article>
      <CompanionComponent
        {...companion}
        companionId={id}
        userName={user.firstName || 'Student'}
        userImage={user.imageUrl}
        userId={user.id}
        userDocuments={userDocuments}
      />
    </main>
  );
};

export default CompanionSession;
