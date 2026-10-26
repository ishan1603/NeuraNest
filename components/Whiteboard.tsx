'use client';

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Sigma, GitBranch, X, Sparkles, Loader2 } from 'lucide-react';

interface WhiteboardProps {
  type: 'mermaid' | 'latex' | null;
  content: string;
  title?: string;
  explanation?: string;
  loading?: boolean;
  onRegenerate?: () => void;
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

export default function Whiteboard({
  type,
  content,
  title,
  explanation,
  loading = false,
  onRegenerate,
  onClose,
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !type || !content || loading) return;
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
        if (!cancelled)
          setRenderError(`Unable to render this ${type === 'mermaid' ? 'diagram' : 'formula'}.`);
      }
    };

    renderVisual();
    return () => {
      cancelled = true;
    };
  }, [type, content, loading]);

  if (!type) return null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          {type === 'mermaid' ? (
            <>
              <GitBranch className="h-4 w-4 text-primary" />
              <span>{title || 'AI Live Concept Architecture'}</span>
            </>
          ) : (
            <>
              <Sigma className="h-4 w-4 text-primary" />
              <span>{title || 'AI Mathematical Derivation'}</span>
            </>
          )}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
            GEMINI 2.5 LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              type="button"
              disabled={loading}
              onClick={onRegenerate}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:border-primary/50 hover:text-primary disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
              <span>Refresh from Live Talk</span>
            </button>
          )}
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
      </div>

      <div className="flex flex-grow flex-col items-center justify-center overflow-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-semibold text-muted-foreground">
              Synthesizing live {type === 'mermaid' ? 'architecture diagram' : 'mathematical formula'} from lecture context...
            </p>
          </div>
        ) : (
          <>
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
              className={
                renderError
                  ? 'hidden'
                  : 'flex max-w-full items-center justify-center overflow-auto py-2'
              }
              style={{ fontSize: type === 'latex' ? '1.35rem' : 'inherit' }}
            />
          </>
        )}
      </div>

      {explanation && !loading && (
        <div className="border-t border-border bg-muted/30 px-5 py-3 text-xs leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">AI Tutor Note: </strong>
          {explanation}
        </div>
      )}
    </div>
  );
}
