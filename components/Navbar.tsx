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
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo.webp" alt="NeuraNest" width={42} height={40} priority />
          <span className="text-lg font-bold tracking-tight max-sm:hidden">NeuraNest</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:block">
            <NavItems />
          </div>

          <div className="flex items-center gap-3">
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
              className="rounded-xl p-2 hover:bg-accent md:hidden"
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
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-[65px] right-0 left-0 z-50 border-b border-border bg-card p-5 shadow-lg md:hidden">
            <NavItems onItemClick={() => setIsMenuOpen(false)} />
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
