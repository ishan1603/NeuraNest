'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Companions', href: '/companions' },
  { label: 'My Journey', href: '/my-journey' },
];

const NavItems = () => {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
      {navItems.map(({ label, href }) => (
        <Link
          href={href}
          key={label}
          className={cn('text-lg md:text-base', pathname === href && 'text-primary font-semibold')}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default NavItems;
