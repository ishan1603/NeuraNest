'use client';

import React, { useState, useRef } from 'react';
import { Mic, GitBranch, Database, Sparkles, Volume2, Zap } from 'lucide-react';

type HeroMode = 'voice' | 'whiteboard' | 'rag';

export default function Hero3DScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: -12, y: 18 });
  const [isHovering, setIsHovering] = useState(false);
  const [mode, setMode] = useState<HeroMode>('voice');
  const [pulseBoost, setPulseBoost] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({
      x: Math.max(-22, Math.min(22, -normY * 32)),
      y: Math.max(-28, Math.min(28, normX * 38)),
    });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: -12, y: 18 });
  };

  return (
    <div className="relative flex w-full flex-col items-center justify-center select-none">
      {/* 3D Interactive Viewport */}
      <div
        ref={stageRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setPulseBoost(b => !b)}
        className="relative flex h-[380px] w-full max-w-[500px] cursor-grab items-center justify-center overflow-visible rounded-3xl border-2 border-border bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 p-6 shadow-inner active:cursor-grabbing sm:h-[420px]"
        style={{ perspective: '1100px' }}
      >
        {/* Background Retro-Grid & Pixel Stars */}
        <div className="hero-3d-grid pointer-events-none absolute inset-0 rounded-3xl opacity-60" />

        {/* Top-Left Arcade Status Pill */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl border-2 border-border bg-card/90 px-3 py-1.5 backdrop-blur-md">
          <span className="size-2.5 animate-ping rounded-full bg-emerald-500" />
          <span className="font-pixel text-[10px] tracking-wider text-foreground uppercase">
            3D ENGINE: ONLINE
          </span>
        </div>

        {/* Top-Right XP Pill */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl border-2 border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-amber-600 backdrop-blur-md dark:text-amber-300">
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span className="font-pixel text-[10px] tracking-wider">+250 XP COMBO</span>
        </div>

        {/* 3D Tilt Container */}
        <div
          className="relative flex size-64 items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${
              pulseBoost ? 1.05 : 1
            })`,
          }}
        >
          {/* 3D Floor Shadow / Hologram Ring */}
          <div
            className="pointer-events-none absolute size-56 rounded-full border-2 border-dashed border-primary/40 bg-primary/5"
            style={{
              transform: 'rotateX(75deg) translateZ(-95px)',
            }}
          />
          <div
            className="pointer-events-none absolute size-40 animate-spin rounded-full border border-indigo-500/40"
            style={{
              transform: 'rotateX(75deg) translateZ(-90px)',
              animationDuration: '14s',
            }}
          />

          {/* Center 3D Isometric Voxel Cube */}
          <div
            className={` hero-cube-spin relative size-32 ${isHovering ? 'paused' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front Face */}
            <div
              className="flex size-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-primary/60 bg-card/90 p-3 shadow-lg backdrop-blur-md"
              style={{ transform: 'translateZ(64px)' }}
            >
              {mode === 'voice' && (
                <>
                  <Mic className="h-7 w-7 text-primary" />
                  <div className="flex h-6 items-end gap-1">
                    {[45, 95, 65, 100, 55, 85, 40].map((h, i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-primary transition-all duration-300"
                        style={{
                          height: `${pulseBoost ? Math.min(100, h + 20) : h}%`,
                          animation: `heroWave 0.9s ease-in-out ${i * 0.1}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-pixel text-[9px] text-primary">VOICE AI</span>
                </>
              )}
              {mode === 'whiteboard' && (
                <>
                  <GitBranch className="h-7 w-7 text-emerald-500" />
                  <span className="font-mono text-xs font-bold text-foreground">
                    ∫ f(x)dx = F(b)
                  </span>
                  <span className="font-pixel text-[9px] text-emerald-500">LIVE BOARD</span>
                </>
              )}
              {mode === 'rag' && (
                <>
                  <Database className="h-7 w-7 text-amber-500" />
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    vec[1536] · 96%
                  </span>
                  <span className="font-pixel text-[9px] text-amber-500">PGVECTOR</span>
                </>
              )}
            </div>

            {/* Back Face */}
            <div
              className="flex size-32 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-indigo-500/50 bg-card/90 p-3 backdrop-blur-md"
              style={{ transform: 'rotateY(180deg) translateZ(64px)' }}
            >
              <Sparkles className="h-7 w-7 text-indigo-500" />
              <span className="font-pixel text-[9px] text-indigo-500">GEMINI 2.5</span>
            </div>

            {/* Right Face */}
            <div
              className="flex size-32 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-emerald-500/50 bg-card/90 p-3 backdrop-blur-md"
              style={{ transform: 'rotateY(90deg) translateZ(64px)' }}
            >
              <GitBranch className="h-7 w-7 text-emerald-500" />
              <span className="font-pixel text-[9px] text-emerald-500">MERMAID</span>
            </div>

            {/* Left Face */}
            <div
              className="flex size-32 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-amber-500/50 bg-card/90 p-3 backdrop-blur-md"
              style={{ transform: 'rotateY(-90deg) translateZ(64px)' }}
            >
              <Database className="h-7 w-7 text-amber-500" />
              <span className="font-pixel text-[9px] text-amber-500">RAG PDF</span>
            </div>

            {/* Top Face */}
            <div
              className="flex size-32 items-center justify-center rounded-2xl border-2 border-primary/40 bg-primary/15 backdrop-blur-md"
              style={{ transform: 'rotateX(90deg) translateZ(64px)' }}
            >
              <span className="font-pixel text-[10px] text-primary">NEURANEST</span>
            </div>

            {/* Bottom Face */}
            <div
              className="size-32 rounded-2xl border-2 border-border bg-muted/60"
              style={{ transform: 'rotateX(-90deg) translateZ(64px)' }}
            />
          </div>

          {/* Orbiting Floating 3D Card 1 — Voice Waveform HUD */}
          <div
            className="hero-float-slow absolute -top-6 -left-14 rounded-2xl border-2 border-border bg-card/95 px-3.5 py-2.5 shadow-md backdrop-blur-md max-sm:-left-4"
            style={{ transform: 'translateZ(75px)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-pixel text-[9px] text-primary">DEEPGRAM + 11LABS</p>
                <p className="text-xs font-bold">Real-Time Voice Tutor</p>
              </div>
            </div>
          </div>

          {/* Orbiting Floating 3D Card 2 — RAG Similarity Node */}
          <div
            className="hero-float-delayed absolute -right-14 -bottom-4 rounded-2xl border-2 border-border bg-card/95 px-3.5 py-2.5 shadow-md backdrop-blur-md max-sm:-right-4"
            style={{ transform: 'translateZ(85px)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <p className="font-pixel text-[9px] text-emerald-500">PDF GROUNDED</p>
                <p className="font-mono text-xs font-bold">94% Vector Match</p>
              </div>
            </div>
          </div>

          {/* Orbiting Floating 3D Card 3 — SM-2 Recall Tag */}
          <div
            className="hero-float-slow absolute -bottom-8 -left-10 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 backdrop-blur-md max-sm:-left-2"
            style={{ transform: 'translateZ(55px)' }}
          >
            <span className="font-pixel text-[9px] text-indigo-600 dark:text-indigo-300">
              ★ SM-2 FLASHCARDS READY
            </span>
          </div>
        </div>

        {/* Bottom Mode Switcher inside the 3D Stage */}
        <div
          onClick={e => e.stopPropagation()}
          className="absolute bottom-3.5 z-20 flex items-center gap-1.5 rounded-2xl border-2 border-border bg-card/90 p-1 backdrop-blur-md"
        >
          {(
            [
              { id: 'voice', label: 'VOICE CORE' },
              { id: 'whiteboard', label: 'WHITEBOARD' },
              { id: 'rag', label: 'PDF VECTOR' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`cursor-pointer rounded-xl px-2.5 py-1 font-pixel text-[9px] transition-colors ${
                mode === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
