'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Sigma, GitBranch, X } from 'lucide-react';

interface WhiteboardProps {
  type: 'mermaid' | 'latex' | null;
  content: string;
  onClose?: () => void;
}

export default function Whiteboard({ type, content, onClose }: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !type || !content) return;

    const renderVisual = async () => {
      try {
        if (type === 'mermaid') {
          const mermaid = (await import('mermaid')).default;
          mermaid.initialize({ startOnLoad: false, theme: 'default' });
          const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), content);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } else if (type === 'latex' && containerRef.current) {
          katex.render(content, containerRef.current, {
            displayMode: true,
            throwOnError: false,
          });
        }
      } catch (e) {
        console.error('Failed to render whiteboard:', e);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<p class="text-sm text-destructive">Unable to render ${type} expression.</p>`;
        }
      }
    };

    renderVisual();
  }, [type, content]);

  if (!type) return null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {type === 'mermaid' ? (
            <>
              <GitBranch className="h-4 w-4 text-primary" />
              <span>Live Architecture / Concept Diagram</span>
            </>
          ) : (
            <>
              <Sigma className="h-4 w-4 text-primary" />
              <span>Live Mathematical Formula</span>
            </>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close whiteboard"
            className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-grow items-center justify-center overflow-auto p-6">
        <div
          ref={containerRef}
          className="flex max-w-full items-center justify-center overflow-auto"
          style={{ fontSize: type === 'latex' ? '1.5rem' : 'inherit' }}
        />
      </div>
    </div>
  );
}
