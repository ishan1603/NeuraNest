import { getDocumentProxy, extractText } from 'unpdf';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parses text from a PDF ArrayBuffer
 */
export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === 'string' ? text : text.join('\n');
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
    currentLength += word.length + 1; // +1 for space

    if (currentLength >= chunkSize) {
      chunks.push(currentChunk.join(' '));
      // Keep overlap words (roughly overlap/5 words)
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
 * Generates embeddings for a batch of text chunks
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
      dimensions: 1536, // pgvector dimension
    });
    const batchEmbeddings = response.data.map(item => item.embedding);
    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
}

