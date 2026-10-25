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
              'rounded-full px-3.5 py-1.5 text-base font-medium transition-[color,background-color] duration-150 md:text-sm',
              isActive
                ? 'bg-primary/12 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
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
