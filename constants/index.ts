export const subjects = ['maths', 'language', 'science', 'history', 'coding', 'economics'] as const;
export type SubjectName = (typeof subjects)[number];

export const subjectsColors: Record<SubjectName, string> = {
  science: '#E5D0FF',
  maths: '#FFDA6E',
  language: '#BDE7FF',
  coding: '#FFC8E4',
  history: '#FFECC8',
  economics: '#C8FFDF',
};

/** ElevenLabs voice ids, keyed by voice gender then conversation style. */
export const voices = {
  male: { casual: '2BJW5coyhAzSr8STdHbE', formal: 'c6SfcYrb2t09NHXiT80T' },
  female: { casual: 'ZIlrSGI4jZqobxRKprJz', formal: 'sarah' },
} as const;

/**
 * Tutoring languages. `deepgramModel` is chosen per language because Nova-3 is
 * best for English while Nova-2 has the broadest multilingual coverage.
 */
export const languages = [
  { code: 'en', label: 'English', deepgramModel: 'nova-3' },
  { code: 'es', label: 'Spanish', deepgramModel: 'nova-2' },
  { code: 'fr', label: 'French', deepgramModel: 'nova-2' },
  { code: 'de', label: 'German', deepgramModel: 'nova-2' },
  { code: 'hi', label: 'Hindi', deepgramModel: 'nova-2' },
  { code: 'it', label: 'Italian', deepgramModel: 'nova-2' },
  { code: 'pt', label: 'Portuguese', deepgramModel: 'nova-2' },
  { code: 'ja', label: 'Japanese', deepgramModel: 'nova-2' },
  { code: 'nl', label: 'Dutch', deepgramModel: 'nova-2' },
] as const;
export type LanguageCode = (typeof languages)[number]['code'];

export const getLanguage = (code?: string | null) =>
  languages.find(l => l.code === code) ?? languages[0];

/** Sort options for the companion marketplace. */
export const companionSorts = [
  { value: 'popular', label: 'Most popular' },
  { value: 'top-rated', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
] as const;
export type CompanionSort = (typeof companionSorts)[number]['value'];

/** A session shorter than this is recorded as `abandoned` and earns nothing. */
export const MIN_COMPLETED_SESSION_SECONDS = 15;

/** Max upload size for study notes (Vercel serverless body limit is 4.5 MB). */
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_COMPANION = 10;
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown'] as const;
