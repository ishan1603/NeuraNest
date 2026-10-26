'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, FileCheck2, Mic, Sparkles } from 'lucide-react';

interface DossierPreset {
  id: 'maths' | 'coding' | 'science' | 'history';
  label: string;
  serial: string;
  color: string;
  tutor: string;
  topic: string;
  pdfCitation: string;
  whiteboardMode: string;
  whiteboardSnippet: string;
  isNumeric: boolean;
  sm2Output: string;
  mrz: string;
}

const DOSSIER_PRESETS: DossierPreset[] = [
  {
    id: 'maths',
    label: 'Maths',
    serial: 'No. 00104-MT',
    color: '#FFE156',
    tutor: 'Prof. Ada // Calculus & Signals',
    topic: 'Fourier Series & Exponential Decay',
    pdfCitation: 'signals_ch4.pdf · Chunk #2 (96% match)',
    whiteboardMode: 'KaTeX Formula + Mermaid Graph',
    whiteboardSnippet: 'f(t) = a_0 + Σ [a_n cos(nωt) + b_n sin(nωt)]',
    isNumeric: true,
    sm2Output: '9 SM-2 Cards Queued · +250 XP',
    mrz: 'NEURANEST<<MATHS<KATEX<PGVECTOR<96PCT<<<<<<',
  },
  {
    id: 'coding',
    label: 'Coding',
    serial: 'No. 00219-CS',
    color: '#F7B7D2',
    tutor: 'Linus AI // Distributed Systems',
    topic: 'Vector Indexing & HNSW Graph Search',
    pdfCitation: 'pgvector_architecture.pdf · Chunk #5 (94% match)',
    whiteboardMode: 'Live Architecture + Complexity',
    whiteboardSnippet: 'Query → HNSW Layer 0 → Cosine Top-K (O(log N))',
    isNumeric: true,
    sm2Output: '11 SM-2 Cards Queued · +300 XP',
    mrz: 'NEURANEST<<CODING<MERMAID<HNSW<PGVECTOR<<<<',
  },
  {
    id: 'science',
    label: 'Science',
    serial: 'No. 00308-SC',
    color: '#DCD0FF',
    tutor: 'Dr. Feynman // Quantum & Bio',
    topic: 'Enzyme Kinetics & Michaelis-Menten',
    pdfCitation: 'biochem_lab_notes.pdf · Chunk #1 (92% match)',
    whiteboardMode: 'Reaction Pathway + KaTeX Rate',
    whiteboardSnippet: 'v = (V_max · [S]) / (K_m + [S])',
    isNumeric: true,
    sm2Output: '8 SM-2 Cards Queued · +220 XP',
    mrz: 'NEURANEST<<SCIENCE<KATEX<PATHWAY<SM2<<<<<<<',
  },
  {
    id: 'history',
    label: 'History',
    serial: 'No. 00412-HS',
    color: '#FFE3B3',
    tutor: 'Clio // Civilizations & Archives',
    topic: 'Treaty of Westphalia & State Sovereignty',
    pdfCitation: 'europe_1648_primary.pdf · Chunk #4 (95% match)',
    whiteboardMode: 'Timeline Flowchart (Numeric Math Hidden)',
    whiteboardSnippet: '1618 Thirty Years War → 1648 Peace → Sovereign States',
    isNumeric: false,
    sm2Output: '10 SM-2 Cards Queued · +240 XP',
    mrz: 'NEURANEST<<HISTORY<TIMELINE<NORETENTIONMATH<',
  },
];

export default function Hero3DScene() {
  const [activeId, setActiveId] = useState<DossierPreset['id']>('maths');
  const active = DOSSIER_PRESETS.find(item => item.id === activeId) ?? DOSSIER_PRESETS[0];

  return (
    <div className="relative mx-auto w-full max-w-[520px] pt-4 pb-2">
      {/* Interactive Subject Switcher Pills above the Certificate */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          INSPECT LIVE LESSON RECEIPT:
        </span>
        <div
          role="tablist"
          aria-label="Preview subject dossier"
          className="flex flex-wrap items-center gap-1.5"
        >
          {DOSSIER_PRESETS.map(preset => {
            const isSelected = preset.id === active.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveId(preset.id)}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border-2 px-2.5 py-1 font-mono text-[11px] font-bold transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-out)] ${
                  isSelected
                    ? 'border-[#191816] text-[#191816] shadow-[2px_2px_0_#191816]'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
                style={isSelected ? { backgroundColor: preset.color } : undefined}
              >
                {isSelected && <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tactile Tilted Certificate Card (NothingOnPurpose style, zero continuous CPU/GPU animations) */}
      <div className="relative rotate-[0.8deg] rounded-2xl border-2 border-[#191816] bg-[#fffdf7] p-4 text-[#191816] shadow-[6px_6px_0_#191816] transition-transform duration-200 ease-[var(--ease-out)] hover:rotate-0 dark:border-[#d8d0be] dark:bg-[#1e1c19] dark:text-[#f5f0e4]">
        {/* Translucent Masking Tape at Top Center */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 rotate-[-1.5deg] rounded-xs border border-[#cbb87a] bg-[#f3e3a3]/90 shadow-2xs"
        />

        {/* Circular Highlighter Yellow Badge at Top Right */}
        <div className="absolute -top-4 -right-3 z-10 flex size-14 rotate-[8deg] flex-col items-center justify-center rounded-full border-2 border-[#191816] bg-[#ffe156] text-[#191816] shadow-[3px_3px_0_#191816]">
          <span className="font-mono text-[9px] leading-none font-bold uppercase">LIVE</span>
          <span className="font-hand text-lg leading-tight font-bold">0ms lag</span>
        </div>

        {/* Tilted Sky-Blue Oval Sticker at Bottom Left */}
        <div className="absolute -bottom-3.5 -left-3 z-10 -rotate-6 rounded-full border-2 border-[#191816] bg-[#a8d8ff] px-4 py-1 text-[#191816] shadow-[3px_3px_0_#191816]">
          <span className="font-hand text-lg font-bold tracking-wide">cites your pdfs ✓</span>
        </div>

        {/* Inner Double-Ruled Certificate Frame */}
        <div className="rounded-xl border border-[#191816]/30 p-4 dark:border-[#f5f0e4]/25">
          {/* Top Serial Row */}
          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-neutral-600 uppercase dark:text-neutral-400">
            <span>NEURANEST · OFFICIAL SESSION DOSSIER</span>
            <span className="font-bold text-[#191816] dark:text-[#f5f0e4]">{active.serial}</span>
          </div>

          {/* Ornamental Star Divider */}
          <div className="my-2.5 flex items-center gap-2 text-xs text-[#c59b27]">
            <div className="h-px flex-1 bg-[#191816]/20 dark:bg-[#f5f0e4]/20" />
            <span aria-hidden="true">★</span>
            <div className="h-px flex-1 bg-[#191816]/20 dark:bg-[#f5f0e4]/20" />
          </div>

          {/* Certificate Portrait + Handwritten Title + Gold Stamp */}
          <div className="grid grid-cols-12 items-center gap-3 py-1">
            {/* Tutor Portrait Box */}
            <div className="col-span-3 flex flex-col items-center justify-center rounded-xl border-2 border-[#191816] p-2.5 text-[#191816] shadow-[2px_2px_0_#191816]"
              style={{ backgroundColor: active.color }}
            >
              <Image
                src={`/icons/${active.id}.svg`}
                alt={active.label}
                width={28}
                height={28}
                className="mb-1"
              />
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase">
                [{active.label}]
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#191816] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#fffdf7]">
                <Mic className="h-2.5 w-2.5 text-[#ffe156]" />
                VOICE
              </span>
            </div>

            {/* Center Title */}
            <div className="col-span-6 space-y-0.5">
              <p className="font-hand text-3xl leading-none font-bold">
                Certificate of Mastery
              </p>
              <p className="font-mono text-[9px] tracking-[0.14em] text-neutral-500 uppercase dark:text-neutral-400">
                REAL-TIME AI TUTORING RECORD
              </p>
              <p className="pt-1 text-xs font-bold leading-snug">
                {active.topic}
              </p>
            </div>

            {/* Right Circular Gold Verification Stamp */}
            <div className="col-span-3 flex justify-end">
              <div className="flex size-16 -rotate-12 flex-col items-center justify-center rounded-full border-2 border-dashed border-[#c59b27] bg-[#fff9e6] p-1 text-center text-[#9a7411] dark:bg-[#2a2415] dark:text-[#e6c14f]">
                <span className="font-mono text-[7px] font-bold tracking-tighter uppercase">
                  GEMINI 2.5
                </span>
                <Sparkles className="my-0.5 h-3 w-3" />
                <span className="font-mono text-[7px] font-bold tracking-tighter uppercase">
                  RAG VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Typewriter Receipt Fields */}
          <div className="mt-3 divide-y divide-[#191816]/15 border-y border-[#191816]/20 font-mono text-xs dark:divide-[#f5f0e4]/15 dark:border-[#f5f0e4]/20">
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[10px] tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                TUTOR
              </span>
              <span className="truncate font-bold">{active.tutor}</span>
            </div>

            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[10px] tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                PDF PROOF
              </span>
              <span className="inline-flex items-center gap-1 truncate rounded-md border border-[#191816]/30 bg-[#b8f2d0] px-2 py-0.5 text-[11px] font-bold text-[#191816]">
                <FileCheck2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{active.pdfCitation}</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[10px] tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                WHITEBOARD
              </span>
              <span className="truncate text-[11px] font-bold">{active.whiteboardMode}</span>
            </div>

            <div className="py-2">
              <div className="flex items-center justify-between text-[10px] tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                <span>LIVE BOARD PREVIEW</span>
                <span>{active.isNumeric ? 'NUMERIC // KATEX ON' : 'HUMANITIES // MATH OFF'}</span>
              </div>
              <div className="mt-1 rounded-lg border border-[#191816]/25 bg-[#f6f2e6] px-2.5 py-1.5 font-mono text-[11px] font-bold text-[#191816] dark:border-[#f5f0e4]/20 dark:bg-[#141311] dark:text-[#ffe156]">
                {active.whiteboardSnippet}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[10px] tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                OUTCOME
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {active.sm2Output}
              </span>
            </div>
          </div>

          {/* Bottom Machine-Readable Typewriter Code (MRZ) */}
          <div className="mt-3 pt-1 text-center font-mono text-[10px] tracking-[0.14em] text-neutral-500 select-all dark:text-neutral-400">
            {active.mrz}
          </div>
        </div>
      </div>

      {/* Handwritten Caption Underneath (matches "Yours will have your name on it.") */}
      <p className="mt-5 text-center font-hand text-xl text-muted-foreground">
        Yours adapts to your voice &amp; uploaded PDFs in real time.
      </p>
    </div>
  );
}
