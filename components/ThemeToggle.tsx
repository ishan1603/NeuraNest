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
      <button
        type="button"
        aria-label="Toggle theme"
        className="flex size-9 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-card p-2 shadow-[2px_2px_0_var(--ink-shadow)]"
      >
        <Image
          src="/icons/moon.svg"
          alt="Loading theme"
          width={18}
          height={18}
          className="dark:invert"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-card p-2 shadow-[2px_2px_0_var(--ink-shadow)] hover:bg-[#ffe156] dark:hover:bg-[#2c2823]"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Image
        src={theme === 'dark' ? '/icons/sun.svg' : '/icons/moon.svg'}
        alt={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        width={18}
        height={18}
        className={theme === 'dark' ? 'invert' : ''}
      />
    </button>
  );
}
