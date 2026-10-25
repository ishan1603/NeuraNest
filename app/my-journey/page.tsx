import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getUserCompanions,
  getUserSessions,
  getBookmarkedCompanions,
  countUserSessions,
} from '@/lib/actions/companion.actions';
import Image from 'next/image';
import CompanionsList from '@/components/CompanionsList';
import { getUserGamificationProfile } from '@/lib/actions/gamification.actions';
import { levelFromXp } from '@/lib/gamification';

const Profile = async () => {
  const user = await currentUser();

  if (!user) redirect('/sign-in');

  const [companions, sessionHistory, sessionCount, bookmarkedCompanions, gamification] =
    await Promise.all([
      getUserCompanions(user.id),
      getUserSessions(user.id),
      countUserSessions(user.id),
      getBookmarkedCompanions(user.id),
      getUserGamificationProfile().catch(() => null),
    ]);

  const xp = gamification?.xp ?? 0;
  const level = levelFromXp(xp);
  const progressPct = Math.min(100, Math.round((level.xpIntoLevel / level.xpForNextLevel) * 100));

  return (
    <main>
      <section className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-7 shadow-xs lg:flex-row lg:items-center">
        <div className="flex items-center gap-5 max-sm:flex-col max-sm:text-center">
          <Image
            src={user.imageUrl}
            alt={user.firstName || 'User'}
            width={96}
            height={96}
            className="rounded-3xl border border-border"
          />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5 max-sm:justify-center">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {user.firstName} {user.lastName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                ★ Level {level.level} · {xp} XP
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </p>
            <div className="mt-1 w-full max-w-xs max-sm:mx-auto">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200 ease-[var(--ease-out)]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {level.xpIntoLevel} / {level.xpForNextLevel} XP to Level {level.level + 1}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col justify-between gap-1 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-1.5 text-amber-500">
              <span className="text-2xl font-bold">{gamification?.streak ?? 0}</span>
              <span className="text-lg">🔥</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">Day Streak</div>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Image
                src="/icons/check.svg"
                alt="completed"
                width={20}
                height={20}
                className="dark:invert"
              />
              <span className="text-2xl font-bold">{sessionCount}</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">Lessons Completed</div>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold">{gamification?.totalMinutes ?? 0}</span>
              <span className="text-xs font-semibold text-muted-foreground">m</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">Minutes Studied</div>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Image
                src="/icons/cap.svg"
                alt="companions"
                width={20}
                height={20}
                className="dark:invert"
              />
              <span className="text-2xl font-bold">{companions.length}</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">Companions Built</div>
          </div>
        </div>
      </section>

      {gamification && gamification.badges.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-7 shadow-xs">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Achievements & Milestones</h2>
              <p className="text-xs text-muted-foreground">
                Derived automatically from your voice sessions, quizzes, and flashcard reviews
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {gamification.badges.filter(b => b.earned).length} / {gamification.badges.length}{' '}
              unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {gamification.badges.map(badge => (
              <div
                key={badge.id}
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-4 ${
                  badge.earned
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-background/60 opacity-65'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{badge.icon}</span>
                  {badge.earned && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Earned
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(badge.progress * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Accordion type="multiple" defaultValue={['recent', 'companions']}>
        <AccordionItem value="bookmarks">
          <AccordionTrigger className="text-xl font-bold">
            Bookmarked Companions ({bookmarkedCompanions.length})
          </AccordionTrigger>
          <AccordionContent>
            <CompanionsList companions={bookmarkedCompanions} title="Bookmarked Companions" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="recent">
          <AccordionTrigger className="text-xl font-bold">Recent Sessions</AccordionTrigger>
          <AccordionContent>
            <CompanionsList title="Recent Sessions" companions={sessionHistory} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="companions">
          <AccordionTrigger className="text-xl font-bold">
            My Companions ({companions.length})
          </AccordionTrigger>
          <AccordionContent>
            <CompanionsList title="My Companions" companions={companions} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
};

export default Profile;
