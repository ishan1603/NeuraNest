/**
 * Gamification engine: XP, levels, streaks, badges and activity heatmap.
 *
 * Everything is *derived* from source-of-truth tables (sessions, quiz attempts,
 * flashcards) instead of being stored, so it can never drift out of sync and
 * is trivially unit-testable.
 */

export interface ActivitySession {
  createdAt: string | Date;
  durationSeconds: number | null;
  subject?: string | null;
}

export interface ActivityQuiz {
  score: number;
  total: number;
  createdAt?: string | Date;
}

export interface GamificationInput {
  sessions: ActivitySession[];
  quizzes: ActivityQuiz[];
  reviewCount: number;
  companionsCreated: number;
  timeZone?: string;
  now?: Date;
}

export const XP_RULES = {
  perMinute: 10,
  perSession: 20,
  perCorrectAnswer: 5,
  perReview: 2,
  perCompanionCreated: 25,
} as const;

/** Cumulative XP needed to *reach* `level` (level 1 = 0 XP, 2 = 100, 3 = 300, 4 = 600 …). */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level)) - 1;
  return 50 * n * (n + 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    xpIntoLevel: xp - floor,
    xpForNextLevel: ceil - floor,
    progress: (xp - floor) / (ceil - floor),
  };
}

/** YYYY-MM-DD in the given IANA time zone. */
export function toDateKey(date: string | Date, timeZone = 'UTC'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return d.toLocaleDateString('en-CA', { timeZone });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function addDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeStreaks(dateKeys: Iterable<string>, todayKey: string) {
  const days = new Set(dateKeys);
  if (days.size === 0) return { current: 0, longest: 0 };

  // Current streak may end today or yesterday (today isn't over yet).
  let cursor = days.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = addDays(sorted[i - 1], 1) === sorted[i] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return { current, longest: Math.max(longest, current) };
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  /** 0..1 */
  progress: number;
}

export function computeGamification(input: GamificationInput) {
  const timeZone = input.timeZone ?? 'UTC';
  const now = input.now ?? new Date();
  const todayKey = toDateKey(now, timeZone);

  const totalSeconds = input.sessions.reduce((sum, s) => sum + Math.max(0, s.durationSeconds ?? 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const correctAnswers = input.quizzes.reduce((sum, q) => sum + q.score, 0);

  const xp =
    totalMinutes * XP_RULES.perMinute +
    input.sessions.length * XP_RULES.perSession +
    correctAnswers * XP_RULES.perCorrectAnswer +
    input.reviewCount * XP_RULES.perReview +
    input.companionsCreated * XP_RULES.perCompanionCreated;

  const minutesByDay = new Map<string, number>();
  const subjectMinutes = new Map<string, number>();
  for (const s of input.sessions) {
    const key = toDateKey(s.createdAt, timeZone);
    const mins = Math.max(0, s.durationSeconds ?? 0) / 60;
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + mins);
    if (s.subject) subjectMinutes.set(s.subject, (subjectMinutes.get(s.subject) ?? 0) + mins);
  }

  const streaks = computeStreaks(minutesByDay.keys(), todayKey);
  const subjectsTried = new Set(input.sessions.map(s => s.subject).filter(Boolean)).size;
  const perfectQuiz = input.quizzes.some(q => q.total >= 3 && q.score === q.total);

  const ratio = (value: number, goal: number) => Math.min(1, value / goal);
  const badges: Badge[] = [
    { id: 'first-session', label: 'First Words', description: 'Complete your first session', icon: '🎙️', progress: ratio(input.sessions.length, 1) },
    { id: 'streak-3', label: 'On a Roll', description: 'Learn 3 days in a row', icon: '🔥', progress: ratio(streaks.longest, 3) },
    { id: 'streak-7', label: 'Week Warrior', description: 'Learn 7 days in a row', icon: '⚡', progress: ratio(streaks.longest, 7) },
    { id: 'streak-30', label: 'Unstoppable', description: 'Learn 30 days in a row', icon: '🏆', progress: ratio(streaks.longest, 30) },
    { id: 'minutes-60', label: 'Hour of Power', description: 'Spend 60 minutes learning', icon: '⏱️', progress: ratio(totalMinutes, 60) },
    { id: 'minutes-600', label: 'Ten-Hour Scholar', description: 'Spend 10 hours learning', icon: '🎓', progress: ratio(totalMinutes, 600) },
    { id: 'polymath', label: 'Polymath', description: 'Study 4 different subjects', icon: '🧭', progress: ratio(subjectsTried, 4) },
    { id: 'quiz-ace', label: 'Quiz Ace', description: 'Score 100% on a quiz', icon: '💯', progress: perfectQuiz ? 1 : 0 },
    { id: 'memory-50', label: 'Memory Master', description: 'Review 50 flashcards', icon: '🧠', progress: ratio(input.reviewCount, 50) },
    { id: 'creator', label: 'Creator', description: 'Build your own companion', icon: '🛠️', progress: ratio(input.companionsCreated, 1) },
  ].map(b => ({ ...b, earned: b.progress >= 1 }));

  return {
    xp,
    ...levelFromXp(xp),
    totalMinutes,
    totalSessions: input.sessions.length,
    correctAnswers,
    streak: streaks.current,
    longestStreak: streaks.longest,
    badges,
    minutesByDay: Object.fromEntries(minutesByDay),
    subjectMinutes: Object.fromEntries(subjectMinutes),
    todayKey,
  };
}

export type GamificationSummary = ReturnType<typeof computeGamification>;

/** Builds a contiguous list of the last `days` date keys ending today (oldest first). */
export function lastNDays(todayKey: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(todayKey, i - days + 1));
}
