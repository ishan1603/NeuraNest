'use client';

import { removeBookmark, addBookmark } from '@/lib/actions/companion.actions';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface CompanionCardProps {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  color: string;
  bookmarked?: boolean;
}

const CompanionCard = ({
  id,
  name,
  topic,
  subject,
  duration,
  color,
  bookmarked: initialBookmarked = false,
}: CompanionCardProps) => {
  const pathname = usePathname();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const handleBookmark = async () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      if (!nextState) {
        await removeBookmark(id, pathname);
      } else {
        await addBookmark(id, pathname);
      }
    } catch (error) {
      setIsBookmarked(!nextState);
      console.error('Failed to update bookmark:', error);
    }
  };

  return (
    <article className="companion-card group" style={{ backgroundColor: color }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-black/10">
            <Image src={`/icons/${subject}.svg`} alt={subject} width={18} height={18} />
          </div>
          <span className="subject-badge">{subject}</span>
        </div>
        <button
          type="button"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark companion'}
          className="companion-bookmark"
          onClick={handleBookmark}
        >
          <Image
            src={isBookmarked ? '/icons/bookmark-filled.svg' : '/icons/bookmark.svg'}
            alt="bookmark"
            width={12.5}
            height={15}
          />
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="line-clamp-1 text-2xl font-bold tracking-tight text-neutral-950">{name}</h2>
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-neutral-800">
          {topic}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-black/10 pt-4">
        <div className="flex items-center gap-1.5 text-neutral-900">
          <Image src="/icons/clock.svg" alt="duration" width={14} height={14} />
          <span className="text-sm font-medium">{duration} mins</span>
        </div>

        <Link href={`/companions/${id}`}>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
          >
            <span>Launch Lesson</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </Link>
      </div>
    </article>
  );
};

export default CompanionCard;
