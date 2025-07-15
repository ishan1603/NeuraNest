'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavItems from './NavItems';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar relative z-50">
        <Link href="/">
          <div className="flex cursor-pointer items-center gap-2.5">
            <Image src="/images/logo.webp" alt="logo" width={46} height={44} />
          </div>
        </Link>
        <div className="flex items-center gap-8">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavItems />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <SignedOut>
              <SignInButton>
                <button className="btn-signin">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
            {/* Mobile Menu Button */}
            <button
              className="rounded-lg p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-16 right-0 left-0 z-50 border-b border-gray-200 bg-white p-4 shadow-lg md:hidden dark:border-gray-800 dark:bg-black">
            <NavItems />
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
