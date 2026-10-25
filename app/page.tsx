export const dynamic = 'force-dynamic';

import CompanionCard from '@/components/CompanionCard';
import CompanionsList from '@/components/CompanionsList';
import CTA from '@/components/CTA';
import { getAllCompanions, getRecentSessions } from '@/lib/actions/companion.actions';
import { getSubjectColor } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, BrainCircuit, FileText, Sparkles } from 'lucide-react';
import React from 'react';

const Page = async () => {
  const companions = await getAllCompanions({ limit: 3 });
  const recentSessionsCompanions = await getRecentSessions(10);

  return (
    <main>
      <section className="rounded-3xl border border-border bg-card p-7 shadow-xs md:p-9">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Voice-First AI Learning Studio</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Master any subject through live voice tutoring & visual whiteboards
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Speak naturally with specialized AI companions that draw Mermaid diagrams, render
              KaTeX equations in real time, search your uploaded PDFs, and generate SM-2 spaced
              repetition flashcards after every session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/companions/new">
              <button type="button" className="btn-primary">
                <span>New Companion</span>
              </button>
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span>Knowledge Base</span>
            </Link>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <BrainCircuit className="h-4 w-4 text-primary" />
              <span>Review Flashcards</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Popular Companions</h2>
          <Link
            href="/companions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            <span>Browse all</span>
          </Link>
        </div>

        <div className="companions-grid">
          {companions.map(companion => (
            <CompanionCard
              key={companion.id}
              {...companion}
              color={getSubjectColor(companion.subject)}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <CompanionsList
          title="Recently Completed Sessions"
          companions={recentSessionsCompanions}
          classNames="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>
    </main>
  );
};

export default Page;
