import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, getSubjectColor } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface CompanionsListProps {
  title: string;
  companions?: Companion[];
  classNames?: string;
}

const CompanionsList = ({ title, companions, classNames }: CompanionsListProps) => {
  return (
    <article className={cn('companion-list', classNames)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {companions?.length || 0} sessions
        </span>
      </div>

      {!companions || companions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
          <p className="font-medium text-muted-foreground">No sessions recorded yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch any AI companion lesson to see your history here.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/3 text-sm font-semibold text-muted-foreground">
                Lesson & Topic
              </TableHead>
              <TableHead className="text-sm font-semibold text-muted-foreground">Subject</TableHead>
              <TableHead className="text-right text-sm font-semibold text-muted-foreground">
                Duration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companions.map(({ id, subject, name, topic, duration }, index) => (
              <TableRow key={`${id}-${index}`} className="group">
                <TableCell>
                  <Link href={`/companions/${id}`}>
                    <div className="flex items-center gap-3.5 py-1">
                      <div
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-black/10 max-md:hidden"
                        style={{ backgroundColor: getSubjectColor(subject) }}
                      >
                        <Image src={`/icons/${subject}.svg`} alt={subject} width={28} height={28} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-lg font-bold tracking-tight group-hover:text-primary">
                          {name}
                        </p>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{topic}</p>
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="subject-badge w-fit max-md:hidden">{subject}</div>
                  <div
                    className="flex w-fit items-center justify-center rounded-xl p-2 md:hidden"
                    style={{ backgroundColor: getSubjectColor(subject) }}
                  >
                    <Image src={`/icons/${subject}.svg`} alt={subject} width={18} height={18} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex w-full items-center justify-end gap-1.5">
                    <p className="text-base font-semibold">
                      {duration} <span className="text-muted-foreground max-md:hidden">mins</span>
                    </p>
                    <Image
                      src="/icons/clock.svg"
                      alt="minutes"
                      width={14}
                      height={14}
                      className="md:hidden dark:invert"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </article>
  );
};

export default CompanionsList;
