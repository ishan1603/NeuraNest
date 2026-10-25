import { describe, it, expect } from 'vitest';
import { reviewCard, formatInterval, ReviewResult } from '@/lib/srs';

describe('reviewCard', () => {
  const now = new Date('2024-01-01T12:00:00Z');
  const baseCard = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };

  it('handles a failed recall (again)', () => {
    const res = reviewCard(baseCard, 'again', now);
    expect(res.lapses).toBe(1);
    expect(res.repetitions).toBe(0);
    expect(res.intervalDays).toBe(0);
    // Due in 10 minutes
    expect(res.dueAt.getTime()).toBe(now.getTime() + 10 * 60 * 1000);
  });

  it('handles first successful recall (good)', () => {
    const res = reviewCard(baseCard, 'good', now);
    expect(res.lapses).toBe(0);
    expect(res.repetitions).toBe(1);
    expect(res.intervalDays).toBe(1);
    expect(res.dueAt.getTime()).toBe(now.getTime() + 24 * 60 * 60 * 1000);
  });

  it('handles first successful recall (easy)', () => {
    const res = reviewCard(baseCard, 'easy', now);
    expect(res.repetitions).toBe(1);
    expect(res.intervalDays).toBe(4);
    expect(res.dueAt.getTime()).toBe(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  });
});

describe('formatInterval', () => {
  const now = new Date('2024-01-01T12:00:00Z');
  
  it('formats short intervals in minutes', () => {
    const res = { dueAt: new Date(now.getTime() + 15 * 60 * 1000) } as ReviewResult;
    expect(formatInterval(res, now)).toBe('15m');
  });

  it('formats medium intervals in days', () => {
    const res = { dueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) } as ReviewResult;
    expect(formatInterval(res, now)).toBe('3d');
  });
});
