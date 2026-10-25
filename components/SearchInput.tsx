'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formUrlQuery, removeKeysFromUrlQuery } from '@jsmastery/utils';

const SearchInput = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        const newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'topic',
          value: searchQuery,
        });

        router.push(newUrl, { scroll: false });
      } else {
        if (pathname === '/companions') {
          const newUrl = removeKeysFromUrlQuery({
            params: searchParams.toString(),
            keysToRemove: ['topic'],
          });

          router.push(newUrl, { scroll: false });
        }
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, router, searchParams, pathname]);

  return (
    <div className="relative flex h-9 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-1 dark:border-neutral-800 dark:bg-neutral-900">
      <Image
        src="/icons/search.svg"
        alt="search"
        width={15}
        height={15}
        className="opacity-70 dark:invert"
      />
      <input
        placeholder="Search companions..."
        className="w-full bg-transparent text-sm outline-none"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
