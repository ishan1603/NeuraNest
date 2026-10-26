'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Companions', href: '/companions' },
  { label: 'Knowledge Base', href: '/knowledge' },
  { label: 'Flashcards', href: '/review' },
  { label: 'My Journey', href: '/my-journey' },
];

interface NavItemsProps {
  onItemClick?: () => void;
}

const NavItems = ({ onItemClick }: NavItemsProps) => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-1.5">
      {navItems.map(({ label, href }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            href={href}
            key={label}
            onClick={onItemClick}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-base font-semibold transition-[color,background-color,transform] duration-150 ease-[var(--ease-out)] md:text-sm',
              isActive
                ? 'border-2 border-[#191816] bg-[#ffe156] font-bold text-[#191816] shadow-[2px_2px_0_#191816]'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavItems;
