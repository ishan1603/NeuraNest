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
      <button className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
        <Image
          src="/icons/moon.svg"
          alt="Loading theme"
          width={20}
          height={20}
          className="dark:invert"
        />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Image
        src={theme === 'dark' ? '/icons/sun.svg' : '/icons/moon.svg'}
        alt={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        width={20}
        height={20}
        className={theme === 'dark' ? 'invert' : ''}
      />
    </button>
  );
}
