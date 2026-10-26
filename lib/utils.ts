import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { subjectsColors, voices, getLanguage } from '@/constants';
import { CreateAssistantDTO } from '@vapi-ai/web/dist/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors] || '#E5D0FF';
};

export const NUMERIC_SUBJECTS = new Set(['maths', 'science', 'coding', 'economics']);

export function isNumericSubject(subject: string): boolean {
  return NUMERIC_SUBJECTS.has((subject || '').toLowerCase());
}

export const configureAssistant = (
  voice: string,
  style: string,
  languageCode: string = 'en',
  options?: {
    subject?: string;
    groundingDocName?: string;
    groundingExcerpts?: string;
  }
) => {
  const voiceId =
    voices[voice as keyof typeof voices]?.[style as keyof (typeof voices)[keyof typeof voices]] ||
    'sarah';

  const lang = getLanguage(languageCode);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const isPublicHttps = appUrl.startsWith('https://');
  const numeric = options?.subject ? isNumericSubject(options.subject) : true;

  const groundingSection =
    options?.groundingExcerpts && options.groundingExcerpts.trim().length > 0
      ? `\n\nIMPORTANT — STUDENT'S UPLOADED PDF DOCUMENT ("${options.groundingDocName || 'Study Notes'}"):\nThe student has grounded this session in their uploaded PDF. Actively weave facts, definitions, and examples from the following retrieved document chunks into your explanation, and explicitly mention "${options.groundingDocName || 'your uploaded PDF'}" when referencing them:\n${options.groundingExcerpts}\n`
      : '';

  const vapiAssistant: CreateAssistantDTO = {
    name: 'Companion',
    firstMessage: options?.groundingDocName
      ? `Hello! Let's start our session on {{topic}}. I also have your uploaded document ${options.groundingDocName} loaded and ready to reference.`
      : "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: 'deepgram',
      model: lang.deepgramModel,
      language: lang.code,
    },
    voice: {
      provider: '11labs',
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 0.9,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.
  
                     Tutor Guidelines:
                     Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
                     Keep the conversation flowing smoothly while maintaining control.
                     From time to time make sure that the student is following you and understands you.
                     Break down the topic into smaller parts and teach the student one part at a time.
                     Keep your style of conversation {{ style }}.
                     Keep your responses short, like in a real voice conversation.
                     When teaching concepts, processes, or architectures, call render_diagram with a detailed, topic-specific Mermaid.js flowchart.${
                       numeric
                         ? ' When teaching mathematical, scientific, or quantitative formulas, call render_equation with the exact LaTeX equation.'
                         : ''
                     }
                     Do not include any special characters in your spoken responses - this is a voice conversation.${groundingSection}`,
        },
      ],
    },
    clientMessages: [
      'transcript',
      'speech-update',
      'hang',
      'status-update',
      'tool-calls',
      'function-call',
    ] as unknown as CreateAssistantDTO['clientMessages'],
    serverMessages: (isPublicHttps
      ? ['end-of-call-report', 'tool-calls']
      : []) as unknown as CreateAssistantDTO['serverMessages'],
    server: isPublicHttps ? { url: `${appUrl}/api/vapi/webhook` } : undefined,
  };

  const tools: unknown[] = [
    {
      type: 'function',
      async: !isPublicHttps,
      messages: [
        {
          type: 'request-start',
          content: 'Let me check your uploaded study notes for that...',
        },
      ],
      function: {
        name: 'search_knowledge_base',
        description:
          "Searches the user's uploaded documents (knowledge base) for information when they ask a specific question about their notes, uploads, or PDFs. It requires a search query and the user_id.",
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to look up in the documents.',
            },
            user_id: {
              type: 'string',
              description: 'The ID of the user. Pass {{user_id}} here to use the variable.',
            },
          },
          required: ['query', 'user_id'],
        },
      },
      ...(isPublicHttps ? { server: { url: `${appUrl}/api/vapi/webhook` } } : {}),
    },
    {
      type: 'function',
      async: true,
      function: {
        name: 'render_diagram',
        description:
          "Renders a detailed, topic-specific Mermaid.js diagram on the user's screen. Use this to visually explain concepts, flowcharts, timelines, or architectures.",
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description:
                "The raw Mermaid.js syntax code (e.g. 'flowchart TD; A[\"Concept\"] --> B[\"Mechanism\"]'). Include 5-8 specific domain nodes.",
            },
            explanation: {
              type: 'string',
              description: 'A brief spoken explanation of what the diagram shows.',
            },
          },
          required: ['code'],
        },
      },
    },
  ];

  if (numeric) {
    tools.push({
      type: 'function',
      async: true,
      function: {
        name: 'render_equation',
        description:
          "Renders a domain-specific mathematical or scientific equation using KaTeX on the user's screen.",
        parameters: {
          type: 'object',
          properties: {
            latex: {
              type: 'string',
              description:
                "The raw LaTeX string specific to the topic (e.g. '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)'). Do not include $ or $$ tags.",
            },
            explanation: {
              type: 'string',
              description: 'A brief spoken explanation of the equation.',
            },
          },
          required: ['latex'],
        },
      },
    });
  }

  // @ts-expect-error - overriding tools for model
  vapiAssistant.model.tools = tools;
  return vapiAssistant;
};
