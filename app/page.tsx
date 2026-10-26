export const dynamic = 'force-dynamic';

import CompanionCard from '@/components/CompanionCard';
import CompanionsList from '@/components/CompanionsList';
import CTA from '@/components/CTA';
import Hero3DScene from '@/components/Hero3DScene';
import { getAllCompanions, getRecentSessions } from '@/lib/actions/companion.actions';
import { getSubjectColor } from '@/lib/utils';
import Link from 'next/link';
import {
  BookOpen,
  BrainCircuit,
  FileText,
  GitBranch,
  Mic,
  Plus,
  Trophy,
} from 'lucide-react';
import React from 'react';

const Page = async () => {
  const [companions, recentSessionsCompanions] = await Promise.all([
    getAllCompanions({ limit: 3 }),
    getRecentSessions(10),
  ]);

  return (
    <main>
      {/* NothingOnPurpose-Inspired Editorial Notebook Hero */}
      <section className="relative pt-2 pb-6 md:pt-6 md:pb-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Handwritten Headline, Highlighter Pill, Wavy Red Underline & Tactile Buttons */}
          <div className="space-y-6 lg:col-span-6">
            {/* Eyebrow Note */}
            <div className="inline-flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 rounded-full border border-[#191816] bg-[#d94e4e]"
              />
              <span className="font-hand text-2xl font-bold text-muted-foreground">
                Interactive AI voice tutoring &amp; live whiteboard studio
              </span>
            </div>

            {/* Big Handwritten Display Stack */}
            <h1 className="font-hand text-6xl leading-[0.94] font-bold tracking-tight sm:text-7xl lg:text-[5.2rem]">
              <span className="block">
                Learn{' '}
                <span className="inline-block -rotate-1 rounded-2xl border-2 border-[#191816] bg-[#ffe156] px-4 py-0.5 text-[#191816] shadow-[4px_4px_0_#191816]">
                  anything.
                </span>
              </span>
              <span className="mt-1 block">Keep the</span>
              <span className="relative mt-0.5 inline-block">
                <span>mastery.</span>
                {/* Hand-drawn red ink wavy underline SVG */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 240 18"
                  fill="none"
                  className="mt-1 h-4 w-full text-[var(--red-ink)]"
                >
                  <path
                    d="M3 11C28 3 47 16 74 9C101 2 122 16 149 9C176 2 198 15 237 7"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Editorial Description */}
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
              Talk naturally with specialized AI voice companions that sketch{' '}
              <strong className="font-semibold text-foreground">
                topic-specific Mermaid &amp; KaTeX diagrams
              </strong>{' '}
              as they teach, cite your{' '}
              <strong className="font-semibold text-foreground">uploaded PDFs</strong> with live
              vector proof, and turn every session into{' '}
              <strong className="font-semibold text-foreground">SM-2 flashcards</strong>.
            </p>

            {/* Typewriter Feature Checklist */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-foreground">✓</span> LIVE WEBRTC VOICE
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-foreground">✓</span> CITES YOUR PDFS
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-foreground">✓</span> LIVE WHITEBOARD
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-foreground">✓</span> SM-2 FLASHCARDS
              </span>
            </div>

            {/* Hand-Inked Offset CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/companions/new"
                className="ink-button-dark inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold"
              >
                <span>Build Voice Tutor</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/knowledge"
                className="ink-button-pink inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold"
              >
                <span>Upload PDF Notes</span>
                <span aria-hidden="true">📄</span>
              </Link>

              <Link
                href="/review"
                className="ink-button-cream inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold"
              >
                <BrainCircuit className="h-4 w-4" />
                <span>SM-2 Review</span>
              </Link>
            </div>

            {/* Handwritten Scroll Cue with Curved Pen Arrow */}
            <div className="flex items-center gap-3 pt-2 text-muted-foreground">
              <svg
                aria-hidden="true"
                width="34"
                height="34"
                viewBox="0 0 42 42"
                fill="none"
                className="shrink-0 text-foreground/75"
              >
                <path
                  d="M8 6C6 18 14 29 30 31M30 31L23 25M30 31L24 37"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-hand text-2xl">
                Pick a companion below or inspect a live lesson receipt
              </span>
            </div>
          </div>

          {/* Right Column: Tactile Official Lesson Dossier / Certificate */}
          <div className="lg:col-span-6">
            <Hero3DScene />
          </div>
        </div>

        {/* 4 Stationery Sticker Pillars */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/companions"
            className="ink-card group flex items-start justify-between gap-3 rounded-2xl p-4 transition-transform duration-150 ease-[var(--ease-out)] hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <span className="inline-block rounded-md border border-[#191816] bg-[#ffe156] px-2 py-0.5 font-mono text-[10px] font-bold text-[#191816]">
                01 // VOICE
              </span>
              <p className="pt-1 text-base font-bold">Coalesced Transcripts</p>
              <p className="text-xs text-muted-foreground">
                Natural turn-taking with zero duplicate lines or pause splits.
              </p>
            </div>
            <Mic className="mt-1 h-5 w-5 shrink-0" />
          </Link>

          <Link
            href="/companions"
            className="ink-card group flex items-start justify-between gap-3 rounded-2xl p-4 transition-transform duration-150 ease-[var(--ease-out)] hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <span className="inline-block rounded-md border border-[#191816] bg-[#a8d8ff] px-2 py-0.5 font-mono text-[10px] font-bold text-[#191816]">
                02 // BOARD
              </span>
              <p className="pt-1 text-base font-bold">Topic-Specific Diagrams</p>
              <p className="text-xs text-muted-foreground">
                Live Mermaid flowcharts + numeric-only KaTeX formulas.
              </p>
            </div>
            <GitBranch className="mt-1 h-5 w-5 shrink-0" />
          </Link>

          <Link
            href="/knowledge"
            className="ink-card group flex items-start justify-between gap-3 rounded-2xl p-4 transition-transform duration-150 ease-[var(--ease-out)] hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <span className="inline-block rounded-md border border-[#191816] bg-[#f7b7d2] px-2 py-0.5 font-mono text-[10px] font-bold text-[#191816]">
                03 // RAG PDF
              </span>
              <p className="pt-1 text-base font-bold">Verified PDF Citations</p>
              <p className="text-xs text-muted-foreground">
                Attach any PDF &amp; inspect the exact matched chunks live.
              </p>
            </div>
            <FileText className="mt-1 h-5 w-5 shrink-0" />
          </Link>

          <Link
            href="/my-journey"
            className="ink-card group flex items-start justify-between gap-3 rounded-2xl p-4 transition-transform duration-150 ease-[var(--ease-out)] hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <span className="inline-block rounded-md border border-[#191816] bg-[#b8f2d0] px-2 py-0.5 font-mono text-[10px] font-bold text-[#191816]">
                04 // MASTERY
              </span>
              <p className="pt-1 text-base font-bold">SM-2 &amp; XP Streaks</p>
              <p className="text-xs text-muted-foreground">
                Spaced-repetition flashcards, post-session quizzes &amp; badges.
              </p>
            </div>
            <Trophy className="mt-1 h-5 w-5 shrink-0" />
          </Link>
        </div>
      </section>

      {/* Featured AI Companions */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
              CATALOG // READY TO LAUNCH
            </span>
            <h2 className="font-hand text-4xl font-bold tracking-tight sm:text-5xl">
              Featured Voice Companions
            </h2>
          </div>
          <Link
            href="/companions"
            className="ink-button-cream inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
          >
            <BookOpen className="h-4 w-4" />
            <span>Browse Full Library →</span>
          </Link>
        </div>

        {companions.length === 0 ? (
          <div className="ink-card flex flex-col items-center justify-center gap-3 rounded-2xl p-10 text-center">
            <p className="font-hand text-3xl font-bold">No companions created yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Build your first custom AI voice tutor in seconds and start an interactive session.
            </p>
            <Link href="/companions/new" className="btn-primary mt-1">
              <Plus className="h-4 w-4" />
              <span>Create Your First Companion</span>
            </Link>
          </div>
        ) : (
          <div className="companions-grid">
            {companions.map(companion => (
              <CompanionCard
                key={companion.id}
                {...companion}
                color={getSubjectColor(companion.subject)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Sessions + CTA */}
      <section className="home-section">
        <CompanionsList
          title="Recent Tutoring Sessions"
          companions={recentSessionsCompanions}
          classNames="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>
    </main>
  );
};

export default Page;
