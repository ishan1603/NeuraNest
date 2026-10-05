'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface WhiteboardProps {
  type: 'mermaid' | 'latex' | null;
  content: string;
}

export default function Whiteboard({ type, content }: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !type || !content) return;

    const renderVisual = async () => {
      try {
        if (type === 'mermaid') {
          mermaid.initialize({ startOnLoad: false, theme: 'default' });
          const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), content);
          containerRef.current!.innerHTML = svg;
        } else if (type === 'latex') {
          katex.render(content, containerRef.current!, {
            displayMode: true,
            throwOnError: false,
          });
        }
      } catch (e) {
        console.error('Failed to render whiteboard:', e);
        containerRef.current!.innerHTML = `<p class="text-red-500">Error rendering ${type}</p>`;
      }
    };

    renderVisual();
  }, [type, content]);

  if (!type) return null;

  return (
    <div className="w-full h-full flex items-center justify-center bg-card rounded-2xl border p-8 shadow-sm">
      <div 
        ref={containerRef} 
        className="max-w-full overflow-auto flex items-center justify-center"
        style={{ fontSize: type === 'latex' ? '1.5rem' : 'inherit' }}
      />
    </div>
  );
}

