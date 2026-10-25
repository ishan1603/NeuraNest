'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils';
import { vapi } from '@/lib/vapi.sdk';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import soundwaves from '@/constants/soundwaves.json';
import { addToSessionHistory } from '@/lib/actions/companion.actions';
import { toast } from 'sonner';

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
    function: {
      name: string;
      arguments: Record<string, string>;
    };
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
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const [visualContent, setVisualContent] = useState<{
    type: 'mermaid' | 'latex';
    content: string;
  } | null>(null);

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

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      toast.success('Voice session started');
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
    };

    const onMessage = (msg: unknown) => {
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
      } else if (message.type === 'call-update') {
        if (message.call && message.call.id && !activeCallId) {
          setActiveCallId(message.call.id);
        }
      } else if (message.type === 'tool-calls') {
        const calls = message.toolCalls || [];
        for (const call of calls) {
          if (call.function.name === 'render_diagram') {
            const { code } = call.function.arguments;
            setVisualContent({ type: 'mermaid', content: code });
          } else if (call.function.name === 'render_equation') {
            const { latex } = call.function.arguments;
            setVisualContent({ type: 'latex', content: latex });
          }
        }
      }
    };

    const onError = (error: unknown) => {
      const err = error as { message?: string };
      console.error('Vapi Error:', err);
      toast.error(err.message || 'Connection failed');
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
  }, [activeCallId]);

  const toggleMicrophone = () => {
    const muted = vapi.isMuted();
    vapi.setMuted(!muted);
    setIsMuted(!muted);
  };

  useEffect(() => {
    if (activeCallId && callStatus === CallStatus.ACTIVE) {
      addToSessionHistory(companionId, activeCallId, 900).catch(console.error);
    }
  }, [activeCallId, callStatus, companionId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setMessages([]);
    setVisualContent(null);
    setActiveCallId(null);

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
      await vapi.start(assistant, assistantOverrides);
    } catch (e) {
      console.error(e);
      setCallStatus(CallStatus.INACTIVE);
      toast.error('Failed to start session');
    }
  };

  const handleDisconnect = () => {
    vapi.stop();
    setCallStatus(CallStatus.FINISHED);
    toast('Ending session...');
  };

  const shortName = name.split(' ')[0].replace(/[.,]/g, '');

  const [WhiteboardComponent, setWhiteboardComponent] = useState<React.ElementType | null>(null);
  useEffect(() => {
    import('./Whiteboard').then(mod => setWhiteboardComponent(() => mod.default));
  }, []);

  return (
    <section className="flex h-[calc(100dvh-160px)] min-h-0 flex-grow flex-col">
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
          <p className="text-2xl font-bold tracking-tight">{name}</p>
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

      <section
        className={cn(
          'mt-6 flex min-h-0 flex-grow gap-6',
          visualContent ? 'flex-row max-md:flex-col' : 'flex-col'
        )}
      >
        <div
          className={cn(
            'relative flex min-h-0 flex-grow flex-col rounded-3xl border border-border bg-card p-5 shadow-xs',
            visualContent ? 'w-1/3 max-md:h-1/2 max-md:w-full' : 'w-full'
          )}
        >
          <div
            ref={transcriptRef}
            className="flex h-full w-full flex-col gap-3 overflow-y-auto overscroll-contain pr-2 pb-12 text-lg scroll-smooth"
          >
            {messages.length === 0 && callStatus === CallStatus.INACTIVE && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Press <strong>Start Session</strong> to begin your interactive voice lesson.
              </p>
            )}
            {messages.length === 0 && callStatus === CallStatus.ACTIVE && (
              <p className="mt-6 text-center text-sm italic text-muted-foreground">Listening...</p>
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
          <div className="w-2/3 flex-grow overflow-hidden rounded-3xl max-md:h-1/2 max-md:w-full">
            <WhiteboardComponent
              type={visualContent.type}
              content={visualContent.content}
              onClose={() => setVisualContent(null)}
            />
          </div>
        )}
      </section>
    </section>
  );
};

export default CompanionComponent;
