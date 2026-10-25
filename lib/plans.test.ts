import { describe, it, expect } from 'vitest';
import { computeSessionAllowance } from '@/lib/plans';

describe('computeSessionAllowance', () => {
  it('allows a free user with no usage to start a session', () => {
    const res = computeSessionAllowance({
      plan: 'free',
      usedSeconds: 0,
      companionDurationMinutes: 15,
    });
    expect(res.allowed).toBe(true);
    expect(res.remainingSeconds).toBe(30 * 60);
    expect(res.maxDurationSeconds).toBe(15 * 60);
  });

  it('restricts duration if remaining minutes are less than companion duration', () => {
    const res = computeSessionAllowance({
      plan: 'free',
      usedSeconds: 28 * 60, // 2 mins left
      companionDurationMinutes: 15,
    });
    expect(res.allowed).toBe(true);
    expect(res.remainingSeconds).toBe(2 * 60);
    expect(res.maxDurationSeconds).toBe(2 * 60);
  });

  it('rejects if no minutes remain', () => {
    const res = computeSessionAllowance({
      plan: 'free',
      usedSeconds: 30 * 60, // fully used
      companionDurationMinutes: 15,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('quota_exhausted');
  });

  it('allows unlimited usage for pro plan', () => {
    const res = computeSessionAllowance({
      plan: 'pro',
      usedSeconds: 1000000,
      companionDurationMinutes: 60,
    });
    expect(res.allowed).toBe(true);
    expect(res.remainingSeconds).toBe(null);
    expect(res.maxDurationSeconds).toBe(60 * 60);
  });
});
