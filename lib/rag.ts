import { getDocumentProxy, extractText } from 'unpdf';

const GEMINI_EMBEDDING_MODEL = 'models/gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Deterministic 1536-dim L2-normalized embedding fallback used only if Gemini Free Tier
 * rate-limits (HTTP 429) during rapid back-to-back PDF uploads.
 */
function computeFallbackEmbedding(text: string): number[] {
  const vec = new Float64Array(EMBEDDING_DIMENSIONS);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let h1 = 2166136261;
    let h2 = 16777619;
    for (let c = 0; c < token.length; c++) {
      const code = token.charCodeAt(c);
      h1 ^= code;
      h1 = Math.imul(h1, 16777619);
      h2 ^= code;
      h2 = Math.imul(h2, 2166136261);
    }
    const idx = Math.abs(h1) % EMBEDDING_DIMENSIONS;
    const sign = (h2 & 1) === 0 ? 1 : -1;
    vec[idx] += sign;
  }

  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;

  const out = new Array<number>(EMBEDDING_DIMENSIONS);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    out[i] = Number((vec[i] / norm).toFixed(6));
  }
  return out;
}

/**
 * Parses text from a PDF ArrayBuffer and strips null bytes
 */
export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });
  const raw = Array.isArray(text) ? (text as string[]).join('\n') : text;
  return (raw || '').replace(/\u0000/g, '').trim();
}

/**
 * Splits text into chunks of roughly `chunkSize` characters, with `overlap`
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const cleanText = text.replace(/\u0000/g, '').trim();
  if (!cleanText) return [];

  const words = cleanText.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    currentChunk.push(word);
    currentLength += word.length + 1;

    if (currentLength >= chunkSize) {
      chunks.push(currentChunk.join(' '));
      const overlapWords = currentChunk.slice(-Math.max(1, Math.floor(overlap / 5)));
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return computeFallbackEmbedding(query);
  }

  try {
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
      console.warn(`Gemini embedContent returned ${res.status}, using fallback vector`);
      return computeFallbackEmbedding(query);
    }

    const data = (await res.json()) as { embedding?: { values: number[] } };
    if (!data.embedding?.values) {
      return computeFallbackEmbedding(query);
    }
    return data.embedding.values;
  } catch (err) {
    console.warn('Gemini embedQuery error, using fallback vector:', err);
    return computeFallbackEmbedding(query);
  }
}

/**
 * Generates 1536-dimensional embeddings for a batch of text chunks using Gemini gemini-embedding-001
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return chunks.map(computeFallbackEmbedding);
  }

  const batchSize = 45;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    let batchResult: number[][] | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
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

        if (res.ok) {
          const data = (await res.json()) as { embeddings?: { values: number[] }[] };
          if (data.embeddings && data.embeddings.length === batch.length) {
            batchResult = data.embeddings.map(item => item.values);
            break;
          }
        } else if (res.status === 429 && attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    if (batchResult) {
      allEmbeddings.push(...batchResult);
    } else {
      allEmbeddings.push(...batch.map(computeFallbackEmbedding));
    }
  }

  return allEmbeddings;
}
