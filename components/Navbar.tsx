'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavItems from './NavItems';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="navbar">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border-2 border-[#191816] bg-[#ffe156] p-1 shadow-[2px_2px_0_#191816]">
            <Image src="/images/logo.webp" alt="NeuraNest" width={28} height={26} priority />
          </div>
          <div className="flex items-baseline gap-1.5 max-sm:hidden">
            <span className="font-hand text-2xl font-bold tracking-tight">NeuraNest</span>
            <span className="rounded-md border border-[var(--border-ink)] bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase">
              v2.5
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-5">
          <div className="hidden md:block">
            <NavItems />
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/companions/new"
              className="ink-button-dark hidden items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold sm:inline-flex"
            >
              <span>New Tutor</span>
              <span aria-hidden="true">→</span>
            </Link>

            <ThemeToggle />

            <SignedOut>
              <SignInButton>
                <button className="btn-signin">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>

            <button
              type="button"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="rounded-xl border-2 border-[var(--border-ink)] bg-card p-2 md:hidden"
              onClick={() => setIsMenuOpen(prev => !prev)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-[65px] right-0 left-0 z-50 border-b-2 border-[var(--border-ink)] bg-card p-5 shadow-lg md:hidden">
            <NavItems onItemClick={() => setIsMenuOpen(false)} />
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
