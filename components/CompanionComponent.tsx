'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils';
import { vapi } from '@/lib/vapi.sdk';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';
import soundwaves from '@/constants/soundwaves.json';
import { addToSessionHistory } from '@/lib/actions/companion.actions';
import { submitQuizAttempt } from '@/lib/actions/flashcard.actions';
import { toast } from 'sonner';
import {
  Brain,
  CheckCircle2,
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

  const [visualContent, setVisualContent] = useState<{
    type: 'mermaid' | 'latex';
    content: string;
  } | null>(null);

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
      console.error('Failed to generate post-session insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  }, [companionId, name, userId, userName]);

  useEffect(() => {
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
        const isFinal = message.transcriptType === 'final';
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;
          const lastMsg = lastMsgIndex >= 0 ? newMessages[lastMsgIndex] : null;

          if (lastMsg && lastMsg.role === message.role && lastMsg.isPartial) {
            newMessages[lastMsgIndex] = {
              ...lastMsg,
              content: message.transcript!,
              isPartial: !isFinal,
            };
          } else if (message.transcript!.trim().length > 0) {
            newMessages.push({
              id: crypto.randomUUID(),
              role: message.role!,
              content: message.transcript!,
              isPartial: !isFinal,
            });
          }
          return newMessages;
        });
      } else if (message.type === 'tool-calls') {
        const calls = message.toolCalls || [];
        for (const call of calls) {
          const rawArgs = call.function.arguments;
          const args: Record<string, string> =
            typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : rawArgs || {};

          if (call.function.name === 'render_diagram') {
            if (args.code) {
              setVisualContent({ type: 'mermaid', content: args.code });
            }
          } else if (call.function.name === 'render_equation') {
            if (args.latex) {
              setVisualContent({ type: 'latex', content: args.latex });
            }
          } else if (call.function.name === 'search_knowledge_base') {
            try {
              const res = await fetch('/api/vapi/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: {
                    type: 'tool-calls',
                    toolCalls: [
                      {
                        id: call.id || 'local-rag',
                        function: {
                          name: 'search_knowledge_base',
                          arguments: {
                            query: args.query || topic,
                            user_id: userId,
                          },
                        },
                      },
                    ],
                  },
                }),
              });
              const data = await res.json();
              const retrieved = data?.results?.[0]?.result;
              if (retrieved) {
                vapi.send({
                  type: 'add-message',
                  message: {
                    role: 'system',
                    content: `Knowledge Base Context for "${args.query || topic}":\n${retrieved}`,
                  },
                });
              }
            } catch (err) {
              console.error('Local RAG search failed:', err);
            }
          }
        }
      }
    };

    const onError = (error: unknown) => {
      const err = error as { message?: string; error?: { message?: string | string[] } };
      console.error('Vapi Error:', err);
      const detail = Array.isArray(err?.error?.message)
        ? err.error.message[0]
        : err?.error?.message || err?.message || 'Voice connection ended';
      toast.error(detail);
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
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
  }, [companionId, name, topic, userId, userName, triggerPostSessionInsights]);

  const toggleMicrophone = () => {
    const muted = vapi.isMuted();
    vapi.setMuted(!muted);
    setIsMuted(!muted);
  };

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setMessages([]);
    setVisualContent(null);
    setInsights(null);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    insightsRequestedRef.current = false;

    const assistant = configureAssistant(voice, style);

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
      addToSessionHistory(companionId, newCallId, 900).catch(console.error);
    } catch (e) {
      console.error(e);
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

  const showSampleDiagram = () => {
    setVisualContent({
      type: 'mermaid',
      content: `flowchart TD\n  A["${subject.toUpperCase()}: ${topic.slice(0, 28)}"] --> B["Core Principles"]\n  B --> C["Worked Example"]\n  C --> D["Active Recall & Mastery"]`,
    });
  };

  const showSampleFormula = () => {
    setVisualContent({
      type: 'latex',
      content:
        subject === 'maths' || subject === 'science'
          ? '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)'
          : '\\text{Retention}(t) = e^{-\\frac{t}{S}}',
    });
  };

  return (
    <section className="flex min-h-[calc(100dvh-160px)] flex-col gap-6 pb-10">
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

          {/* Interactive Whiteboard Quick Controls */}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={showSampleDiagram}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <GitBranch className="h-3.5 w-3.5 text-primary" />
              <span>Concept Map</span>
            </button>
            <button
              type="button"
              onClick={showSampleFormula}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Sigma className="h-3.5 w-3.5 text-primary" />
              <span>Key Formula</span>
            </button>
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
          'flex min-h-[320px] flex-grow gap-6',
          visualContent ? 'flex-row max-md:flex-col' : 'flex-col'
        )}
      >
        <div
          className={cn(
            'relative flex min-h-[300px] flex-grow flex-col rounded-3xl border border-border bg-card p-5 shadow-xs',
            visualContent ? 'w-1/3 max-md:h-1/2 max-md:w-full' : 'w-full'
          )}
        >
          <div
            ref={transcriptRef}
            className="flex h-full max-h-[380px] w-full flex-col gap-3 overflow-y-auto overscroll-contain pr-2 pb-12 text-lg scroll-smooth"
          >
            {messages.length === 0 && callStatus === CallStatus.INACTIVE && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Press <strong>Start Session</strong> to begin your interactive voice lesson, or use{' '}
                <strong>Concept Map</strong> / <strong>Key Formula</strong> above to open the live
                whiteboard.
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
                <span className="mb-1 text-xs font-semibold text-muted-foreground">
                  {message.role === 'assistant' ? shortName : userName}
                </span>
                <p
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-base leading-relaxed',
                    message.role === 'assistant'
                      ? 'rounded-tl-sm bg-muted text-foreground'
                      : 'rounded-tr-sm bg-primary text-primary-foreground',
                    message.isPartial && 'opacity-75'
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
          <div className="min-h-[320px] w-2/3 flex-grow overflow-hidden rounded-3xl max-md:w-full">
            <WhiteboardComponent
              type={visualContent.type}
              content={visualContent.content}
              onClose={() => setVisualContent(null)}
            />
          </div>
        )}
      </section>

      {/* Post-Session AI Insights & Interactive Quiz */}
      {insightsLoading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-border bg-card p-8 shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-semibold">
            Synthesizing session summary, SM-2 flashcards, and quiz with Gemini 2.5 Flash...
          </p>
        </div>
      )}

      {insights && (
        <section className="space-y-6 rounded-3xl border border-border bg-card p-7 shadow-xs">
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
