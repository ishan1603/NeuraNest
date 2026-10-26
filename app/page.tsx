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
      {/* Big 3D Hero Stage */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-border bg-card p-7 shadow-sm md:p-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/40 bg-primary/10 px-3.5 py-1.5 font-pixel text-[10px] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>STAGE 01 // VOICE + 3D LEARNING STUDIO</span>
              </span>
              <span className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-pixel text-[10px] text-emerald-600 dark:text-emerald-400">
                GEMINI 2.5 FLASH + PGVECTOR
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.85rem] lg:leading-[1.1]">
              Level up in any subject with{' '}
              <span className="bg-gradient-to-r from-primary via-amber-500 to-indigo-500 bg-clip-text text-transparent">
                live AI voice tutors
              </span>{' '}
              & interactive whiteboards.
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Talk naturally with specialized AI companions that cite your uploaded PDFs with
              real-time vector proof, draw live Mermaid & KaTeX diagrams mid-lecture, and turn every
              session into SuperMemo SM-2 flashcards, quizzes, and XP streaks.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/companions/new" className="btn-primary px-6 py-3.5 text-sm">
                <Plus className="h-4 w-4" />
                <span>Build AI Companion</span>
              </Link>
              <Link
                href="/knowledge"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-bold transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span>Upload PDF Notes</span>
              </Link>
              <Link
                href="/review"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-bold transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <BrainCircuit className="h-4 w-4 text-primary" />
                <span>SM-2 Flashcards</span>
              </Link>
            </div>

            {/* 4 Game-Style Quest Pillars */}
            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              <Link
                href="/companions"
                className="group flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-background/80 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <Mic className="h-4 w-4 text-primary" />
                  <span className="font-pixel text-[9px] text-muted-foreground">01</span>
                </div>
                <p className="text-xs font-bold">Voice Tutors</p>
                <p className="text-[11px] text-muted-foreground">Low-latency WebRTC</p>
              </Link>

              <Link
                href="/companions"
                className="group flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-background/80 p-3.5 transition-all hover:-translate-y-0.5 hover:border-emerald-500"
              >
                <div className="flex items-center justify-between">
                  <GitBranch className="h-4 w-4 text-emerald-500" />
                  <span className="font-pixel text-[9px] text-muted-foreground">02</span>
                </div>
                <p className="text-xs font-bold">AI Whiteboard</p>
                <p className="text-[11px] text-muted-foreground">Live Mermaid & KaTeX</p>
              </Link>

              <Link
                href="/knowledge"
                className="group flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-background/80 p-3.5 transition-all hover:-translate-y-0.5 hover:border-amber-500"
              >
                <div className="flex items-center justify-between">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <span className="font-pixel text-[9px] text-muted-foreground">03</span>
                </div>
                <p className="text-xs font-bold">PDF Grounding</p>
                <p className="text-[11px] text-muted-foreground">1536-dim pgvector proof</p>
              </Link>

              <Link
                href="/my-journey"
                className="group flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-background/80 p-3.5 transition-all hover:-translate-y-0.5 hover:border-indigo-500"
              >
                <div className="flex items-center justify-between">
                  <Trophy className="h-4 w-4 text-indigo-500" />
                  <span className="font-pixel text-[9px] text-muted-foreground">04</span>
                </div>
                <p className="text-xs font-bold">XP & Quests</p>
                <p className="text-[11px] text-muted-foreground">SM-2 & 10 badges</p>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive 3D Holo-Cube & Orbiting HUD */}
          <div className="lg:col-span-5">
            <Hero3DScene />
          </div>
        </div>
      </section>

      {/* Popular Companions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-pixel text-[10px] text-primary uppercase">
              SELECT YOUR TUTOR
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Featured AI Companions</h2>
          </div>
          <Link
            href="/companions"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card px-3.5 py-2 text-xs font-bold hover:border-primary"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Explore Library</span>
          </Link>
        </div>

        {companions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
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
