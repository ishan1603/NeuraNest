'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
        <Image
          src="/icons/moon.svg"
          alt="Loading theme"
          width={24}
          height={24}
          className="dark:invert"
        />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex cursor-pointer items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Image
        src={theme === 'dark' ? '/icons/sun.svg' : '/icons/moon.svg'}
        alt={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        width={24}
        height={24}
        className={theme === 'dark' ? 'invert' : ''}
      />
    </button>
  );
}
