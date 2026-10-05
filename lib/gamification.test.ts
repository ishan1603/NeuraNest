import { describe, it, expect } from 'vitest';
import { computeGamification, computeStreaks, levelFromXp } from '@/lib/gamification';

describe('Gamification levels', () => {
  it('computes correct levels from XP', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(300).level).toBe(3);
  });
});

describe('Streaks', () => {
  it('computes simple active streak', () => {
    const keys = ['2024-01-01', '2024-01-02', '2024-01-03'];
    const res = computeStreaks(keys, '2024-01-03');
    expect(res.current).toBe(3);
    expect(res.longest).toBe(3);
  });

  it('keeps streak if played yesterday but not today yet', () => {
    const keys = ['2024-01-01', '2024-01-02'];
    const res = computeStreaks(keys, '2024-01-03');
    expect(res.current).toBe(2);
  });

  it('breaks streak if missed yesterday', () => {
    const keys = ['2024-01-01'];
    const res = computeStreaks(keys, '2024-01-03');
    expect(res.current).toBe(0);
    expect(res.longest).toBe(1);
  });
});

describe('computeGamification', () => {
  it('aggregates correctly', () => {
    const res = computeGamification({
      sessions: [
        { createdAt: '2024-01-01T10:00:00Z', durationSeconds: 600, subject: 'maths' },
        { createdAt: '2024-01-01T11:00:00Z', durationSeconds: 300, subject: 'science' },
      ],
      quizzes: [{ score: 5, total: 5 }],
      reviewCount: 10,
      companionsCreated: 1,
      now: new Date('2024-01-01T12:00:00Z'),
    });
    
    // 15 mins = 150, 2 sessions = 40, 5 answers = 25, 10 reviews = 20, 1 comp = 25 -> 260 XP
    expect(res.xp).toBe(260);
    expect(res.totalMinutes).toBe(15);
    expect(res.level).toBe(2);
    expect(res.subjectMinutes['maths']).toBe(10);
  });
});
