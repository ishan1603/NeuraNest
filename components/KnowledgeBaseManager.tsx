'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDocuments,
  deleteDocument,
  type DocumentRecord,
} from '@/lib/actions/knowledge.actions';
import { toast } from 'sonner';
import {
  CheckCircle2,
  FileText,
  Layers,
  Loader2,
  Trash2,
  Upload,
  AlertCircle,
  Sparkles,
  Database,
} from 'lucide-react';

interface KnowledgeBaseManagerProps {
  initialDocs?: DocumentRecord[];
}

export default function KnowledgeBaseManager({ initialDocs }: KnowledgeBaseManagerProps) {
  const [docs, setDocs] = useState<DocumentRecord[]>(initialDocs ?? []);
  const [loading, setLoading] = useState(initialDocs === undefined);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocs(data);
    } catch (e: unknown) {
      toast.error(
        'Failed to load documents: ' + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialDocs === undefined) {
      fetchDocs();
    }
  }, [initialDocs, fetchDocs]);

  const handleDelete = async (id: string) => {
    const previous = docs;
    try {
      setDocs(prev => prev.filter(d => d.id !== id));
      await deleteDocument(id);
      toast.success('Document removed from knowledge base');
    } catch (e: unknown) {
      setDocs(previous);
      toast.error('Error deleting: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      toast.success(`Indexed "${file.name}" into ${data.chunks} semantic vector chunks`);
      if (data.document) {
        setDocs(prev => [data.document as DocumentRecord, ...prev]);
      } else {
        fetchDocs();
      }
    } catch (e: unknown) {
      toast.error('Upload failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const totalChunks = docs.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{docs.length}</p>
            <p className="text-xs font-medium text-muted-foreground">Indexed PDF Documents</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{totalChunks}</p>
            <p className="text-xs font-medium text-muted-foreground">1536-dim Vector Chunks</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold">HNSW Cosine Index</p>
            <p className="text-xs font-medium text-muted-foreground">
              Gemini Embedding-001 · pgvector
            </p>
          </div>
        </div>
      </div>

      {/* Dropzone & Upload Card */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !uploading) handleUpload(file);
        }}
        className={`relative flex flex-col items-start justify-between gap-6 rounded-3xl border-2 border-dashed p-7 transition-colors duration-150 sm:flex-row sm:items-center ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card shadow-xs'
        }`}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Real-Time Voice RAG Grounding</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Upload Study Material or Lecture Slides (PDF)
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Drag and drop a PDF here or click to browse. Text is extracted with{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">unpdf</code>,
            embedded via Google Gemini{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              gemini-embedding-001
            </code>
            , and indexed in Supabase{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pgvector</code>.
          </p>
        </div>

        <label className="btn-primary shrink-0 cursor-pointer px-6 py-3.5">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Indexing PDF...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Select PDF File</span>
            </>
          )}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {/* Document Grid */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">No documents uploaded yet</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Upload lecture slides, textbook chapters, or study notes above so your AI tutors can
            search and cite them during live voice sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-xs transition-all duration-150 hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold" title={doc.name}>
                      {doc.name}
                    </h3>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {new Date(doc.created_at).toLocaleDateString()} ·{' '}
                      {Math.max(1, Math.round((doc.size_bytes || 0) / 1024))} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Delete document"
                  onClick={() => handleDelete(doc.id)}
                  className="cursor-pointer rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground tabular-nums">
                  <Layers className="h-3.5 w-3.5" />
                  {doc.chunk_count || 0} vector chunks
                </span>
                {doc.status === 'failed' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 font-semibold text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    Failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Indexed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
