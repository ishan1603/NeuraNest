'use client';

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Sigma, GitBranch, X } from 'lucide-react';

interface WhiteboardProps {
  type: 'mermaid' | 'latex' | null;
  content: string;
  onClose?: () => void;
}

let mermaidInitialized = false;

/** Cleans LLM-generated Mermaid: strips code fences, escapes, and stray "mermaid" prefixes. */
function sanitizeMermaid(code: string): string {
  return code
    .replace(/```(?:mermaid)?/gi, '')
    .replace(/\\n/g, '\n')
    .replace(/^\s*mermaid\s*\n/i, '')
    .replace(/;\s*$/gm, '')
    .trim();
}

/** Cleans LLM-generated LaTeX: strips $ / $$ / \[ \] delimiters. */
function sanitizeLatex(code: string): string {
  return code
    .trim()
    .replace(/^\${1,2}|\${1,2}$/g, '')
    .replace(/^\\\[|\\\]$/g, '')
    .trim();
}

export default function Whiteboard({ type, content, onClose }: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !type || !content) return;
    let cancelled = false;
    setRenderError(null);

    const renderVisual = async () => {
      try {
        if (type === 'mermaid') {
          const mermaid = (await import('mermaid')).default;
          if (!mermaidInitialized) {
            mermaid.initialize({
              startOnLoad: false,
              theme: 'neutral',
              securityLevel: 'strict',
              suppressErrorRendering: true,
            });
            mermaidInitialized = true;
          }

          const code = sanitizeMermaid(content);
          const valid = await mermaid.parse(code, { suppressErrors: true });
          if (!valid) {
            if (!cancelled) setRenderError('The tutor sent a diagram that could not be drawn.');
            return;
          }

          const id = 'mermaid-svg-' + Math.random().toString(36).slice(2);
          const { svg } = await mermaid.render(id, code);
          // Mermaid leaves a temp node in <body> on some failures; clean it up.
          document.getElementById('d' + id)?.remove();
          if (!cancelled && containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } else if (type === 'latex' && containerRef.current) {
          katex.render(sanitizeLatex(content), containerRef.current, {
            displayMode: true,
            throwOnError: false,
          });
        }
      } catch (e) {
        console.warn('Whiteboard render skipped:', e);
        if (!cancelled) setRenderError(`Unable to render this ${type === 'mermaid' ? 'diagram' : 'formula'}.`);
      }
    };

    renderVisual();
    return () => {
      cancelled = true;
    };
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
        {renderError && (
          <div className="max-w-md space-y-2 text-center">
            <p className="text-sm font-semibold text-muted-foreground">{renderError}</p>
            <pre className="max-h-40 overflow-auto rounded-xl bg-muted p-3 text-left text-xs whitespace-pre-wrap">
              {content}
            </pre>
          </div>
        )}
        <div
          ref={containerRef}
          className={renderError ? 'hidden' : 'flex max-w-full items-center justify-center overflow-auto'}
          style={{ fontSize: type === 'latex' ? '1.5rem' : 'inherit' }}
        />
      </div>
    </div>
  );
}
