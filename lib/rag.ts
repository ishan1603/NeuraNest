import { getDocumentProxy, extractText } from 'unpdf';

const GEMINI_EMBEDDING_MODEL = 'models/gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 1536;

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  return apiKey;
}

/**
 * Parses text from a PDF ArrayBuffer
 */
export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? (text as string[]).join('\n') : text;
}

/**
 * Splits text into chunks of roughly `chunkSize` characters, with `overlap`
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    currentChunk.push(word);
    currentLength += word.length + 1;

    if (currentLength >= chunkSize) {
      chunks.push(currentChunk.join(' '));
      const overlapWords = currentChunk.slice(-Math.floor(overlap / 5));
      currentChunk = [...overlapWords];
      currentLength = currentChunk.join(' ').length;
    }
  }

  if (currentChunk.length > 0 && chunks.length === 0) {
    chunks.push(currentChunk.join(' '));
  } else if (currentChunk.length > 0 && currentLength > overlap) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

/**
 * Generates a 1536-dimensional embedding for a single search query using Gemini gemini-embedding-001
 */
export async function embedQuery(query: string): Promise<number[]> {
  const apiKey = getGeminiApiKey();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GEMINI_EMBEDDING_MODEL,
        content: { parts: [{ text: query }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embedContent failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { embedding?: { values: number[] } };
  if (!data.embedding?.values) {
    throw new Error('Invalid embedding response from Gemini API');
  }
  return data.embedding.values;
}

/**
 * Generates 1536-dimensional embeddings for a batch of text chunks using Gemini gemini-embedding-001
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const apiKey = getGeminiApiKey();
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${GEMINI_EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map(text => ({
            model: GEMINI_EMBEDDING_MODEL,
            content: { parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIMENSIONS,
          })),
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini batchEmbedContents failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { embeddings?: { values: number[] }[] };
    if (!data.embeddings) {
      throw new Error('Invalid batch embedding response from Gemini API');
    }

    allEmbeddings.push(...data.embeddings.map(item => item.values));
  }

  return allEmbeddings;
}
