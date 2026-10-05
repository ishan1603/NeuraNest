'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils';
import { vapi } from '@/lib/vapi.sdk';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';
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
  style,
  voice,
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [isSpeaking]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      toast.success('Session started');
    };
    
    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
      // Let the webhook handle finalization, but we can do a fallback here if needed.
    };
    
    const onMessage = (message: any) => {
      if (message.type === 'transcript') {
        const isFinal = message.transcriptType === 'final';
        setMessages(prev => {
          // If it's partial, we want to update the latest partial message for this role, or add a new one
          const newMessages = [...prev];
          
          // Find if the last message is from the same role and is partial
          const lastMsgIndex = newMessages.length - 1;
          const lastMsg = lastMsgIndex >= 0 ? newMessages[lastMsgIndex] : null;

          if (lastMsg && lastMsg.role === message.role && lastMsg.isPartial) {
             // Update existing partial
             newMessages[lastMsgIndex] = {
               ...lastMsg,
               content: message.transcript,
               isPartial: !isFinal
             };
          } else if (message.transcript.trim().length > 0) {
             // Add new
             newMessages.push({
               id: crypto.randomUUID(),
               role: message.role,
               content: message.transcript,
               isPartial: !isFinal
             });
          }
          return newMessages;
        });
      } else if (message.type === 'call-update') {
        if (message.call && message.call.id && !activeCallId) {
          setActiveCallId(message.call.id);
        }
      }
    };
    
    const onError = (error: any) => {
      console.error('Vapi Error:', error);
      toast.error(error.message || 'Connection failed');
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
    const isMuted = vapi.isMuted();
    vapi.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    if (activeCallId && callStatus === CallStatus.ACTIVE) {
       // Typically we need a max duration from somewhere, defaulting to 15 mins (900s) for now
       addToSessionHistory(companionId, activeCallId, 900).catch(console.error);
    }
  }, [activeCallId, callStatus, companionId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setMessages([]);
    setActiveCallId(null);

    const assistant = configureAssistant(voice, style);

    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
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

  return (
    <section className="flex flex-col flex-grow min-h-0 h-[calc(100vh-150px)]">
      <section className="flex gap-8 max-sm:flex-col shrink-0">
        <div className="companion-section">
          <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject) }}>
            <div
              className={cn(
                'absolute transition-opacity duration-1000',
                callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE
                  ? 'opacity-100'
                  : 'opacity-0',
                callStatus === CallStatus.CONNECTING && 'animate-pulse opacity-100'
              )}
            >
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={150}
                height={150}
                className="max-sm:h-[80px] max-sm:w-[80px]"
              />
            </div>
            <div
              className={cn(
                'absolute transition-opacity duration-1000',
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
          <p className="text-2xl font-bold">{name}</p>
        </div>
        <div className="user-section">
          <div className="user-avatar">
            <Image src={userImage} alt={userName} width={130} height={130} className="rounded-lg" />
            <p className="text-2xl font-bold">{userName}</p>
          </div>
          <button
            className="btn-mic"
            onClick={toggleMicrophone}
            disabled={callStatus !== CallStatus.ACTIVE}
          >
            <Image
              src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'}
              alt="mic"
              width={36}
              height={36}
              className="dark:invert"
            />
            <p className="max-sm:hidden">
              {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
            </p>
          </button>
          <button
            className={cn(
              'w-full cursor-pointer rounded-lg py-2 text-white transition-colors',
              callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary',
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

      <section className="flex flex-col flex-grow min-h-0 mt-8 relative">
        <div 
          ref={transcriptRef} 
          className="flex flex-col gap-4 overflow-y-auto pb-20 pr-4 w-full h-full text-xl max-sm:text-lg scroll-smooth"
        >
          {messages.length === 0 && callStatus === CallStatus.ACTIVE && (
            <p className="text-muted-foreground text-center italic mt-4">Listening...</p>
          )}
          {messages.map(message => (
            <div key={message.id} className={cn("flex flex-col max-w-[80%]", message.role === 'assistant' ? 'self-start' : 'self-end')}>
               <span className="text-sm font-semibold mb-1 opacity-70">
                 {message.role === 'assistant' ? shortName : userName}
               </span>
               <p className={cn(
                 "px-4 py-3 rounded-2xl", 
                 message.role === 'assistant' ? 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none',
                 message.isPartial && 'opacity-70'
               )}>
                 {message.content}
               </p>
            </div>
          ))}
        </div>
        <div className="from-background via-background/90 pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t to-transparent" />
      </section>
    </section>
  );
};

export default CompanionComponent;
