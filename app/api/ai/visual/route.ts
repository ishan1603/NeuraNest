import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const VisualSchema = z.object({
  title: z.string(),
  content: z.string(),
  explanation: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type = 'mermaid',
      subject = 'science',
      topic = 'General Concept',
      transcript = '',
      pdfContext = '',
    } = body as {
      type?: 'mermaid' | 'latex';
      subject?: string;
      topic?: string;
      transcript?: string;
      pdfContext?: string;
    };

    const gemini = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });

    const promptContext = [
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      transcript ? `Recent Live Lecture Transcript:\n${transcript.slice(-2500)}` : '',
      pdfContext ? `Reference Document Context:\n${pdfContext.slice(0, 1500)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const systemPrompt =
      type === 'mermaid'
        ? `You are an expert educational diagram designer. Generate a detailed, domain-accurate Mermaid.js flowchart (flowchart TD or flowchart LR) that teaches the exact concepts of the given topic and live transcript.
Rules:
- Output ONLY valid Mermaid syntax in the "content" field starting with "flowchart TD" or "flowchart LR".
- Do NOT include markdown code fences (\`\`\`).
- Include 6 to 10 specific, informative nodes with real domain terminology (never generic placeholders like "Core Principles" or "Worked Example").
- Always wrap node labels in double quotes, e.g. A["RDF Triple (Subject - Predicate - Object)"] --> B["OWL Ontology Reasoning"].
- Provide a clear title and a 1-2 sentence explanation of how the diagram connects to the topic.`
        : `You are an expert STEM & quantitative professor. Generate the most important, domain-specific mathematical equation, derivation, or quantitative model in raw KaTeX/LaTeX for the given subject, topic, and live lecture transcript.
Rules:
- Output ONLY raw LaTeX in the "content" field (do NOT wrap in $ or $$).
- Make the equation specific to the exact topic being discussed (e.g., for calculus: fundamental theorem or Taylor series; for physics: relevant law/Hamiltonian; for coding/CS: Big-O recurrence, Bellman equation, or information entropy; for economics: Black-Scholes, Cobb-Douglas, or IS-LM equation).
- Use \\begin{aligned} ... \\end{aligned} if showing a multi-line relationship or variable definitions.
- Provide a clear title and a 1-2 sentence explanation of every variable in the formula.`;

    const completion = await gemini.chat.completions.parse({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptContext },
      ],
      response_format: zodResponseFormat(VisualSchema, 'visual'),
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('Failed to generate visual');
    }

    return NextResponse.json({
      success: true,
      visual: parsed,
    });
  } catch (error) {
    console.warn('AI Visual Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate visual aid' },
      { status: 500 }
    );
  }
}
