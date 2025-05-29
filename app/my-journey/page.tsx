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
} from '@/lib/actions/companion.actions';
import Image from 'next/image';
import CompanionsList from '@/components/CompanionsList';

const Profile = async () => {
  const user = await currentUser();

  if (!user) redirect('/sign-in');

  const companions = await getUserCompanions(user.id);
  const sessionHistory = await getUserSessions(user.id);
  const bookmarkedCompanions = await getBookmarkedCompanions(user.id);

  return (
    <main className="min-lg:w-3/4">
      <section className="flex items-center justify-between gap-4 max-sm:flex-col">
        <div className="flex items-center gap-4">
          <Image src={user.imageUrl} alt={user.firstName!} width={110} height={110} />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground text-sm">{user.emailAddresses[0].emailAddress}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="rouded-lg flex h-fit flex-col gap-2 border border-black p-3">
            <div className="flex items-center gap-2">
              <Image src="/icons/check.svg" alt="checkmark" width={22} height={22} />
              <p className="text-2xl font-bold">{sessionHistory.length}</p>
            </div>
            <div>Lessons completed</div>
          </div>
          <div className="rouded-lg flex h-fit flex-col gap-2 border border-black p-3">
            <div className="flex items-center gap-2">
              <Image src="/icons/cap.svg" alt="cap" width={22} height={22} />
              <p className="text-2xl font-bold">{companions.length}</p>
            </div>
            <div>Companions created</div>
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
