export const dynamic = 'force-dynamic';

import CompanionCard from '@/components/CompanionCard';
import CompanionsList from '@/components/CompanionsList';
import CTA from '@/components/CTA';
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
  Sparkles,
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
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-xs md:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Modal AI Voice Learning Studio</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
              Master any subject through live voice tutoring & visual whiteboards
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Converse naturally with specialized AI tutors that draw Mermaid flowcharts, render
              KaTeX equations in real time, ground answers in your uploaded PDFs via pgvector, and
              synthesize SuperMemo SM-2 flashcards after every session.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/companions/new" className="btn-primary px-5 py-3">
                <Plus className="h-4 w-4" />
                <span>Create Companion</span>
              </Link>
              <Link
                href="/knowledge"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span>Upload PDF Notes</span>
              </Link>
              <Link
                href="/review"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                <BrainCircuit className="h-4 w-4 text-primary" />
                <span>SM-2 Flashcards</span>
              </Link>
            </div>
          </div>

          {/* 4 Capability Pillars */}
          <div className="grid grid-cols-2 gap-3 sm:w-full lg:w-[420px] shrink-0">
            <Link
              href="/companions"
              className="group flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mic className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold">Low-Latency Voice</p>
              <p className="text-xs text-muted-foreground">
                Deepgram Nova-3 STT & ElevenLabs voices
              </p>
            </Link>

            <Link
              href="/companions"
              className="group flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <GitBranch className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold">Live Whiteboard</p>
              <p className="text-xs text-muted-foreground">
                Real-time Mermaid diagrams & KaTeX math
              </p>
            </Link>

            <Link
              href="/knowledge"
              className="group flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileText className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold">RAG Vector Search</p>
              <p className="text-xs text-muted-foreground">
                Gemini 1536-dim embeddings in pgvector
              </p>
            </Link>

            <Link
              href="/my-journey"
              className="group flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Trophy className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold">SM-2 & XP Streaks</p>
              <p className="text-xs text-muted-foreground">
                Spaced repetition & 10 mastery badges
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Companions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured AI Companions</h2>
            <p className="text-xs text-muted-foreground">
              Launch an interactive voice lesson with a specialized tutor
            </p>
          </div>
          <Link
            href="/companions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            <span>Browse all</span>
          </Link>
        </div>

        {companions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-base font-bold">No companions created yet</p>
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
