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
import { calculateLevel } from '@/lib/gamification';

const Profile = async () => {
  const user = await currentUser();

  if (!user) redirect('/sign-in');

  const companions = await getUserCompanions(user.id);
  const sessionHistory = await getUserSessions(user.id);
  const sessionCount = await countUserSessions(user.id);
  const bookmarkedCompanions = await getBookmarkedCompanions(user.id);
  const gamification = await getUserGamificationProfile();

  const level = gamification ? calculateLevel(gamification.xp) : { level: 1, currentLevelXp: 0, nextLevelXp: 100 };

  return (
    <main className="min-lg:w-3/4">
      <section className="flex items-center justify-between gap-4 max-sm:flex-col">
        <div className="flex items-center gap-4">
          <Image src={user.imageUrl} alt={user.firstName!} width={110} height={110} className="rounded-full" />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName} <span className="text-xl text-yellow-500">★ Lvl {level.level}</span>
            </h1>
            <p className="text-muted-foreground text-sm">{user.emailAddresses[0].emailAddress}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
              <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${(level.currentLevelXp / level.nextLevelXp) * 100}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground">{level.currentLevelXp} / {level.nextLevelXp} XP to next level</p>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="rounded-xl flex h-fit flex-col gap-2 border border-border p-4 bg-card">
            <div className="flex items-center gap-2 text-yellow-500">
              <span className="text-2xl font-bold">{gamification?.streak_days || 0}</span>
              <span className="text-xl">🔥</span>
            </div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          <div className="rounded-xl flex h-fit flex-col gap-2 border border-border p-4 bg-card">
            <div className="flex items-center gap-2 text-primary">
              <Image src="/icons/check.svg" alt="checkmark" width={22} height={22} className="dark:invert" />
              <span className="text-2xl font-bold">{sessionCount}</span>
            </div>
            <div className="text-sm text-muted-foreground">Lessons completed</div>
          </div>
          <div className="rounded-xl flex h-fit flex-col gap-2 border border-border p-4 bg-card">
            <div className="flex items-center gap-2 text-primary">
              <Image src="/icons/cap.svg" alt="cap" width={22} height={22} className="dark:invert" />
              <span className="text-2xl font-bold">{companions.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">Companions created</div>
          </div>
        </div>
      </section>
      <Accordion type="multiple">
        <AccordionItem value="bookmarks">
          <AccordionTrigger className="text-2xl font-bold">
            Bookmarked Companions {`(${bookmarkedCompanions.length})`}
          </AccordionTrigger>
          <AccordionContent>
            <CompanionsList companions={bookmarkedCompanions} title="Bookmarked Companions" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="recent">
          <AccordionTrigger className="text-2xl font-bold">Recent Sessions</AccordionTrigger>
          <AccordionContent>
            <CompanionsList title="Recent Sessions" companions={sessionHistory} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="companions">
          <AccordionTrigger className="text-2xl font-bold">
            My Companions {`(${companions.length})`}
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
