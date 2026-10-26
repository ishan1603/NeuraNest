'use client';

import { cn, configureAssistant, getSubjectColor, isNumericSubject } from '@/lib/utils';
import { vapi } from '@/lib/vapi.sdk';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';
import soundwaves from '@/constants/soundwaves.json';
import { addToSessionHistory } from '@/lib/actions/companion.actions';
import { submitQuizAttempt } from '@/lib/actions/flashcard.actions';
import {
  retrieveDocumentContext,
  type DocumentRecord,
  type RetrievedChunkProof,
} from '@/lib/actions/knowledge.actions';
import { toast } from 'sonner';
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FileText,
  GitBranch,
  Loader2,
  Sigma,
  Sparkles,
  Trophy,
} from 'lucide-react';

enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

interface SavedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  committedText: string;
  partialText: string;
  lastFinalSegment: string;
  isPartial?: boolean;
}

interface VapiMessage {
  type: string;
  transcriptType?: string;
  role?: 'user' | 'assistant' | 'system';
  transcript?: string;
  call?: { id: string };
  toolCalls?: Array<{
    id?: string;
    function: {
      name: string;
      arguments: Record<string, string> | string;
    };
  }>;
}

interface SessionInsights {
  summary: string;
  key_concepts: string[];
  flashcards: Array<{ front: string; back: string }>;
  quiz: Array<{
    question: string;
    options: string[];
    correct_option_index: number;
  }>;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  style: string;
  voice: string;
  userDocuments?: DocumentRecord[];
}

const CompanionComponent = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  userId,
  style,
  voice,
  userDocuments = [],
}: CompanionComponentProps & { userId: string }) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const messagesRef = useRef<SavedMessage[]>([]);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const insightsRequestedRef = useRef(false);
  const lastProcessedTranscriptRef = useRef<string>('');

  const numericSubject = isNumericSubject(subject);

  // RAG Grounding state
  const [selectedDocId, setSelectedDocId] = useState<string>(
    userDocuments.length > 0 ? userDocuments[0].id : 'none'
  );
  const [ragProofs, setRagProofs] = useState<RetrievedChunkProof[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [showRagProofDrawer, setShowRagProofDrawer] = useState(false);

  // Whiteboard state
  const [visualContent, setVisualContent] = useState<{
    type: 'mermaid' | 'latex';
    content: string;
    title?: string;
    explanation?: string;
  } | null>(null);
  const [visualLoading, setVisualLoading] = useState(false);

  // Post-Session AI Insights state
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<SessionInsights | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);

  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Load RAG chunks whenever selectedDocId changes
  const loadRagContext = useCallback(
    async (docId: string, searchQuery: string) => {
      if (!docId || docId === 'none') {
        setRagProofs([]);
        return [];
      }
      setRagLoading(true);
      try {
        const proofs = await retrieveDocumentContext({
          documentId: docId,
          query: searchQuery || topic,
          limit: 4,
        });
        setRagProofs(proofs);
        return proofs;
      } catch (err) {
        console.warn('Could not load RAG context:', err);
        return [];
      } finally {
        setRagLoading(false);
      }
    },
    [topic]
  );

  useEffect(() => {
    if (selectedDocId && selectedDocId !== 'none') {
      loadRagContext(selectedDocId, topic);
    } else {
      setRagProofs([]);
    }
  }, [selectedDocId, topic, loadRagContext]);

  const generateAiVisual = useCallback(
    async (type: 'mermaid' | 'latex') => {
      setVisualLoading(true);
      setVisualContent(prev => ({
        type,
        content: prev?.type === type ? prev.content : '',
        title: type === 'mermaid' ? 'Synthesizing Concept Diagram...' : 'Synthesizing Formula...',
      }));

      try {
        const transcriptText = messagesRef.current
          .map(m => `${m.role === 'assistant' ? name : userName}: ${m.content}`)
          .join('\n');
        const pdfText = ragProofs.map(p => p.content).join('\n\n');

        const res = await fetch('/api/ai/visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            subject,
            topic,
            transcript: transcriptText,
            pdfContext: pdfText,
          }),
        });
        const data = await res.json();
        if (res.ok && data.visual) {
          setVisualContent({
            type,
            content: data.visual.content,
            title: data.visual.title,
            explanation: data.visual.explanation,
          });
        } else {
          toast.error('Could not generate visual aid right now.');
          setVisualContent(null);
        }
      } catch (err) {
        console.warn('AI visual generation error:', err);
        setVisualContent(null);
      } finally {
        setVisualLoading(false);
      }
    },
    [name, ragProofs, subject, topic, userName]
  );

  const triggerPostSessionInsights = useCallback(async () => {
    if (insightsRequestedRef.current) return;
    const currentMsgs = messagesRef.current;
    if (currentMsgs.length === 0) return;

    insightsRequestedRef.current = true;
    const callIdToUse = activeCallIdRef.current || crypto.randomUUID();
    const durationSeconds = callStartTimeRef.current
      ? Math.max(15, Math.round((Date.now() - callStartTimeRef.current) / 1000))
      : 60;

    const transcriptText = currentMsgs
      .map(m => `${m.role === 'assistant' ? name : userName}: ${m.content}`)
      .join('\n');

    setInsightsLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callIdToUse,
          companionId,
          userId,
          transcript: transcriptText,
          durationSeconds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.insights) {
        setInsights(data.insights);
        if (data.sessionId) setSessionId(data.sessionId);
        toast.success(
          `Generated session summary & ${data.insights.flashcards?.length || 0} SM-2 flashcards!`
        );
      }
    } catch (err) {
      console.warn('Failed to generate post-session insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  }, [companionId, name, userId, userName]);

  useEffect(() => {
    // Clear any previously attached listeners so React StrictMode / re-renders never double-bind
    vapi.removeAllListeners();

    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      callStartTimeRef.current = Date.now();
      toast.success('Voice session connected');
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
      triggerPostSessionInsights();
    };

    const onMessage = async (msg: unknown) => {
      const message = msg as VapiMessage;
      if (message.type === 'transcript' && message.transcript && message.role) {
        const cleanSegment = message.transcript.trim();
        if (!cleanSegment) return;

        const isFinal = message.transcriptType === 'final';
        const dedupKey = `${message.role}:${isFinal ? 'F' : 'P'}:${cleanSegment}`;
        if (lastProcessedTranscriptRef.current === dedupKey) {
          return;
        }
        lastProcessedTranscriptRef.current = dedupKey;

        setMessages(prev => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          const last = lastIdx >= 0 ? next[lastIdx] : null;

          // Keep consecutive sentences from the SAME speaker in ONE unified turn bubble
          if (last && last.role === message.role) {
            if (isFinal) {
              // Ignore duplicate final event for the exact same sentence
              if (
                last.lastFinalSegment === cleanSegment ||
                last.committedText.endsWith(cleanSegment)
              ) {
                return prev;
              }
              const updatedCommitted = last.committedText
                ? `${last.committedText} ${cleanSegment}`
                : cleanSegment;
              next[lastIdx] = {
                ...last,
                committedText: updatedCommitted,
                partialText: '',
                lastFinalSegment: cleanSegment,
                content: updatedCommitted,
                isPartial: false,
              };
            } else {
              // Partial streaming segment appended cleanly after committed sentences in this turn
              if (last.lastFinalSegment === cleanSegment) return prev;
              const combined = last.committedText
                ? `${last.committedText} ${cleanSegment}`
                : cleanSegment;
              next[lastIdx] = {
                ...last,
                partialText: cleanSegment,
                content: combined,
                isPartial: true,
              };
            }
            return next;
          }

          // Speaker changed: start a new turn bubble
          next.push({
            id: crypto.randomUUID(),
            role: message.role!,
            committedText: isFinal ? cleanSegment : '',
            partialText: isFinal ? '' : cleanSegment,
            lastFinalSegment: isFinal ? cleanSegment : '',
            content: cleanSegment,
            isPartial: !isFinal,
          });
          return next;
        });
      } else if (message.type === 'tool-calls') {
        const raw = message as VapiMessage & { toolCallList?: VapiMessage['toolCalls'] };
        const calls = raw.toolCalls || raw.toolCallList || [];
        for (const call of calls) {
          if (!call?.function?.name) continue;
          const rawArgs = call.function.arguments;
          let args: Record<string, string> = {};
          try {
            args =
              typeof rawArgs === 'string'
                ? JSON.parse(rawArgs || '{}')
                : (rawArgs as Record<string, string>) || {};
          } catch {
            console.warn('Could not parse tool arguments:', rawArgs);
            continue;
          }

          if (call.function.name === 'render_diagram') {
            if (args.code) {
              setVisualContent({
                type: 'mermaid',
                content: args.code,
                title: 'Live AI Tutor Diagram',
                explanation: args.explanation,
              });
            }
          } else if (call.function.name === 'render_equation' && numericSubject) {
            if (args.latex) {
              setVisualContent({
                type: 'latex',
                content: args.latex,
                title: 'Live AI Tutor Formula',
                explanation: args.explanation,
              });
            }
          } else if (call.function.name === 'search_knowledge_base') {
            try {
              const proofs = await loadRagContext(
                selectedDocId === 'none' ? 'all' : selectedDocId,
                args.query || topic
              );
              if (proofs.length > 0) {
                setShowRagProofDrawer(true);
                const retrievedText = proofs
                  .map(
                    p =>
                      `[${p.documentName} - Chunk #${p.chunkIndex + 1} (${Math.round(p.similarity * 100)}% match)]: ${p.content}`
                  )
                  .join('\n\n');
                vapi.send({
                  type: 'add-message',
                  message: {
                    role: 'system',
                    content: `Retrieved from student's uploaded PDF for query "${args.query || topic}":\n${retrievedText}`,
                  },
                });
                toast.success(
                  `Tutor referenced ${proofs.length} chunks from "${proofs[0].documentName}"`
                );
              }
            } catch (err) {
              console.warn('Local RAG search failed:', err);
            }
          }
        }
      }
    };

    const onError = (error: unknown) => {
      const err = (error || {}) as {
        type?: string;
        message?: unknown;
        errorMsg?: string;
        error?: unknown;
      };

      if (
        err.type === 'audio-processing-setup-error' ||
        err.type === 'audio-observer-setup-error' ||
        err.type === 'audio-processor-recovery-error'
      ) {
        return;
      }

      const extract = (val: unknown, depth = 0): string => {
        if (!val || depth > 4) return '';
        if (typeof val === 'string') return val;
        if (Array.isArray(val)) return extract(val[0], depth + 1);
        if (typeof val === 'object') {
          const o = val as Record<string, unknown>;
          return (
            extract(o.errorMsg, depth + 1) ||
            extract(o.msg, depth + 1) ||
            extract(o.message, depth + 1) ||
            extract(o.error, depth + 1) ||
            extract(o.type, depth + 1)
          );
        }
        return String(val);
      };
      const detail = extract(err) || 'Voice connection ended';

      if (/meeting has ended|ejected|meeting ended/i.test(detail)) {
        setCallStatus(CallStatus.FINISHED);
        setIsSpeaking(false);
        triggerPostSessionInsights();
        return;
      }

      console.warn('Vapi error:', detail, err);
      toast.error(detail);
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
      triggerPostSessionInsights();
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('error', onError);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);

    return () => {
      vapi.removeAllListeners();
    };
  }, [
    companionId,
    loadRagContext,
    name,
    numericSubject,
    selectedDocId,
    topic,
    triggerPostSessionInsights,
    userId,
    userName,
  ]);

  const toggleMicrophone = () => {
    const muted = vapi.isMuted();
    vapi.setMuted(!muted);
    setIsMuted(!muted);
  };

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setMessages([]);
    setInsights(null);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    insightsRequestedRef.current = false;
    lastProcessedTranscriptRef.current = '';

    // Ensure fresh RAG chunks are loaded for the chosen document before starting
    let activeProofs = ragProofs;
    if (selectedDocId !== 'none' && activeProofs.length === 0) {
      activeProofs = await loadRagContext(selectedDocId, topic);
    }

    const groundingDocName =
      activeProofs.length > 0
        ? activeProofs[0].documentName
        : userDocuments.find(d => d.id === selectedDocId)?.name;

    const groundingExcerpts =
      activeProofs.length > 0
        ? activeProofs
            .map(
              p =>
                `[Excerpt #${p.chunkIndex + 1} (${Math.round(p.similarity * 100)}% relevance)]: ${p.content}`
            )
            .join('\n\n')
        : undefined;

    const assistant = configureAssistant(voice, style, 'en', {
      subject,
      groundingDocName,
      groundingExcerpts,
    });

    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
        user_id: userId,
      },
    };

    try {
      const call = await vapi.start(assistant, assistantOverrides);
      const newCallId = call?.id || crypto.randomUUID();
      setActiveCallId(newCallId);
      activeCallIdRef.current = newCallId;
      addToSessionHistory(companionId, newCallId, 900).catch(console.warn);
    } catch (e) {
      console.warn(e);
      setCallStatus(CallStatus.INACTIVE);
      toast.error('Failed to start session. Check microphone permissions.');
    }
  };

  const handleDisconnect = () => {
    vapi.stop();
    setCallStatus(CallStatus.FINISHED);
    setIsSpeaking(false);
    toast('Session ended — generating study insights...');
    triggerPostSessionInsights();
  };

  const handleQuizSubmit = async () => {
    if (!insights?.quiz || quizSubmitted) return;
    let score = 0;
    const answersArr: number[] = [];
    insights.quiz.forEach((q, idx) => {
      const chosen = selectedAnswers[idx] ?? -1;
      answersArr.push(chosen);
      if (chosen === q.correct_option_index) score += 1;
    });
    setQuizSubmitted(true);
    toast.success(`Quiz scored ${score}/${insights.quiz.length}! XP added to your journey.`);
    if (sessionId) {
      await submitQuizAttempt(sessionId, score, insights.quiz.length, answersArr);
    }
  };

  const shortName = name.split(' ')[0].replace(/[.,]/g, '');

  const [WhiteboardComponent, setWhiteboardComponent] = useState<React.ElementType | null>(null);
  useEffect(() => {
    import('./Whiteboard').then(mod => setWhiteboardComponent(() => mod.default));
  }, []);

  return (
    <section className="flex min-h-[calc(100dvh-160px)] flex-col gap-6 pb-10">
      {/* RAG Document Grounding & Proof Bar */}
      <div className="rounded-3xl border-2 border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">PDF Knowledge Grounding (RAG)</h3>
                {ragProofs.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ● ACTIVE · {ragProofs.length} CHUNKS MATCHED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                    {userDocuments.length === 0 ? 'NO PDFS UPLOADED' : 'UNGROUNDED'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {ragProofs.length > 0
                  ? `Tutor is grounded in "${ragProofs[0].documentName}" (top match: ${Math.round(ragProofs[0].similarity * 100)}% vector similarity)`
                  : 'Select an uploaded PDF so your AI tutor teaches directly from your course notes.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {userDocuments.length > 0 ? (
              <select
                aria-label="Select grounding PDF document"
                value={selectedDocId}
                onChange={e => setSelectedDocId(e.target.value)}
                className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {userDocuments.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.name} ({doc.chunk_count} chunks)
                  </option>
                ))}
                <option value="all">📚 All Uploaded PDFs ({userDocuments.length})</option>
                <option value="none">🚫 Do Not Reference PDFs</option>
              </select>
            ) : (
              <Link
                href="/knowledge"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold hover:border-primary/50"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Upload a PDF in Knowledge Base</span>
              </Link>
            )}

            {ragProofs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRagProofDrawer(prev => !prev)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                <span>{showRagProofDrawer ? 'Hide PDF Proof' : 'View PDF Citations'}</span>
                {showRagProofDrawer ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Proof Drawer showing exact retrieved chunks & similarity scores */}
        {showRagProofDrawer && ragProofs.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Verified pgvector Excerpts Injected into Tutor Context ({ragProofs[0].documentName})
              </p>
              {ragLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ragProofs.map(proof => (
                <div
                  key={proof.id}
                  className="rounded-2xl border border-border bg-background p-3.5 text-xs"
                >
                  <div className="mb-1.5 flex items-center justify-between font-mono">
                    <span className="font-bold text-primary">
                      📄 {proof.documentName} · Chunk #{proof.chunkIndex + 1}
                    </span>
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(proof.similarity * 100)}% match
                    </span>
                  </div>
                  <p className="line-clamp-4 leading-relaxed text-muted-foreground">
                    {proof.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Avatar + User Controls Stage */}
      <section className="flex shrink-0 gap-6 max-sm:flex-col">
        <div className="companion-section">
          <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject) }}>
            <div
              className={cn(
                'absolute transition-opacity duration-200 ease-[var(--ease-out)]',
                callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE
                  ? 'opacity-100'
                  : 'opacity-0',
                callStatus === CallStatus.CONNECTING && 'animate-pulse opacity-100'
              )}
            >
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={140}
                height={140}
                className="max-sm:h-[72px] max-sm:w-[72px]"
              />
            </div>
            <div
              className={cn(
                'absolute transition-opacity duration-200 ease-[var(--ease-out)]',
                callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={soundwaves}
                autoplay={false}
                className="companion-lottie"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tracking-tight">{name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{topic}</p>
          </div>

          {/* Live AI Whiteboard Generators (Formula shown ONLY for numeric subjects) */}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              disabled={visualLoading}
              onClick={() => generateAiVisual('mermaid')}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <GitBranch className="h-3.5 w-3.5 text-primary" />
              <span>Generate AI Concept Diagram</span>
            </button>

            {numericSubject && (
              <button
                type="button"
                disabled={visualLoading}
                onClick={() => generateAiVisual('latex')}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Sigma className="h-3.5 w-3.5 text-primary" />
                <span>Generate AI Formula</span>
              </button>
            )}
          </div>
        </div>

        <div className="user-section">
          <div className="user-avatar">
            <Image
              src={userImage}
              alt={userName}
              width={110}
              height={110}
              className="rounded-2xl"
            />
            <p className="text-xl font-bold">{userName}</p>
          </div>
          <button
            type="button"
            className="btn-mic"
            onClick={toggleMicrophone}
            disabled={callStatus !== CallStatus.ACTIVE}
          >
            <Image
              src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'}
              alt="mic"
              width={32}
              height={32}
              className="dark:invert"
            />
            <p className="text-sm font-medium max-sm:hidden">
              {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
            </p>
          </button>
          <button
            type="button"
            className={cn(
              'w-full cursor-pointer rounded-2xl py-3 font-semibold text-white transition-colors duration-150',
              callStatus === CallStatus.ACTIVE ? 'bg-red-600 hover:bg-red-700' : 'bg-primary',
              callStatus === CallStatus.CONNECTING && 'animate-pulse'
            )}
            onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            {callStatus === CallStatus.ACTIVE
              ? 'End Session'
              : callStatus === CallStatus.CONNECTING
                ? 'Connecting...'
                : 'Start Session'}
          </button>
        </div>
      </section>

      {/* Live Transcript + Split-Screen Whiteboard */}
      <section
        className={cn(
          'flex min-h-[340px] flex-grow gap-6',
          visualContent ? 'flex-row max-md:flex-col' : 'flex-col'
        )}
      >
        <div
          className={cn(
            'relative flex min-h-[320px] flex-grow flex-col rounded-3xl border-2 border-border bg-card p-5 shadow-xs',
            visualContent ? 'w-1/3 max-md:h-1/2 max-md:w-full' : 'w-full'
          )}
        >
          <div
            ref={transcriptRef}
            className="flex h-full max-h-[400px] w-full flex-col gap-3.5 overflow-y-auto overscroll-contain pr-2 pb-12 text-lg scroll-smooth"
          >
            {messages.length === 0 && callStatus === CallStatus.INACTIVE && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Press <strong>Start Session</strong> to begin your interactive voice lesson, or click{' '}
                <strong>Generate AI Concept Diagram</strong> above to synthesize a live diagram for{' '}
                <em>{topic}</em>.
              </p>
            )}
            {messages.length === 0 && callStatus === CallStatus.ACTIVE && (
              <p className="mt-6 text-center text-sm italic text-muted-foreground">
                Listening... Speak naturally with {shortName}.
              </p>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex max-w-[88%] flex-col',
                  message.role === 'assistant' ? 'self-start' : 'self-end'
                )}
              >
                <span className="mb-1 text-xs font-bold text-muted-foreground">
                  {message.role === 'assistant' ? shortName : userName}
                </span>
                <p
                  className={cn(
                    'rounded-2xl px-4 py-3 text-base leading-relaxed',
                    message.role === 'assistant'
                      ? 'rounded-tl-sm border border-border bg-muted/70 text-foreground'
                      : 'rounded-tr-sm bg-primary text-primary-foreground',
                    message.isPartial && 'opacity-85'
                  )}
                >
                  {message.content}
                </p>
              </div>
            ))}
          </div>
          <div className="from-card via-card/85 pointer-events-none absolute right-0 bottom-0 left-0 h-12 rounded-b-3xl bg-gradient-to-t to-transparent" />
        </div>

        {visualContent && WhiteboardComponent && (
          <div className="min-h-[340px] w-2/3 flex-grow overflow-hidden rounded-3xl max-md:w-full">
            <WhiteboardComponent
              type={visualContent.type}
              content={visualContent.content}
              title={visualContent.title}
              explanation={visualContent.explanation}
              loading={visualLoading}
              onRegenerate={() => generateAiVisual(visualContent.type)}
              onClose={() => setVisualContent(null)}
            />
          </div>
        )}
      </section>

      {/* Post-Session AI Insights & Interactive Quiz */}
      {insightsLoading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border-2 border-border bg-card p-8 shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-semibold">
            Synthesizing session summary, SM-2 flashcards, and quiz with Gemini 2.5 Flash...
          </p>
        </div>
      )}

      {insights && (
        <section className="space-y-6 rounded-3xl border-2 border-border bg-card p-7 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini 2.5 Flash Session Synthesis</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Post-Session Study Report</h3>
            </div>
            {insights.flashcards?.length > 0 && (
              <Link href="/review" className="btn-primary text-xs">
                <Brain className="h-4 w-4" />
                <span>Review {insights.flashcards.length} New SM-2 Flashcards</span>
              </Link>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Executive Summary
            </h4>
            <p className="text-sm leading-relaxed text-foreground md:text-base">
              {insights.summary}
            </p>
          </div>

          {insights.key_concepts?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                Key Concepts Covered
              </h4>
              <div className="flex flex-wrap gap-2">
                {insights.key_concepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.quiz?.length > 0 && (
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-lg font-bold">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>Quick Mastery Check ({insights.quiz.length} Questions)</span>
                </h4>
              </div>

              <div className="space-y-4">
                {insights.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="space-y-3 rounded-2xl border border-border bg-background p-5"
                  >
                    <p className="text-sm font-bold md:text-base">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === oIdx;
                        const isCorrect = q.correct_option_index === oIdx;
                        let optionStyle =
                          'border-border bg-card hover:border-primary/50 text-foreground';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            optionStyle =
                              'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
                          } else if (isSelected && !isCorrect) {
                            optionStyle =
                              'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300';
                          }
                        } else if (isSelected) {
                          optionStyle = 'border-primary bg-primary/10 text-primary';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() =>
                              setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))
                            }
                            className={`cursor-pointer rounded-xl border p-3 text-left text-xs font-semibold transition-colors md:text-sm ${optionStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={handleQuizSubmit}
                  className="btn-primary px-6 py-3 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submit Answers & Claim XP</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Quiz completed! Check your updated XP & badges in{' '}
                    <Link href="/my-journey" className="underline">
                      My Journey
                    </Link>
                    .
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </section>
  );
};

export default CompanionComponent;
