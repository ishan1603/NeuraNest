/**
 * Subscription plans & usage metering (pure, framework-free → unit tested).
 *
 * Plans are configured in Clerk Billing. We resolve the plan from Clerk's
 * `has()` helper and meter *voice minutes per calendar month*, which is the
 * main cost driver of a voice-AI product (STT + LLM + TTS are billed per minute).
 */

export type PlanId = 'free' | 'core' | 'pro';

export interface PlanLimits {
  label: string;
  companionLimit: number;
  monthlyMinutes: number;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: { label: 'Basic', companionLimit: 3, monthlyMinutes: 30 },
  core: { label: 'Core', companionLimit: 10, monthlyMinutes: 300 },
  pro: { label: 'Pro', companionLimit: Number.POSITIVE_INFINITY, monthlyMinutes: Number.POSITIVE_INFINITY },
};

type HasFn = (params: { plan?: string; feature?: string }) => boolean;

/** Maps Clerk plans/features to an internal plan id (feature keys kept for v1 compatibility). */
export function resolvePlan(has: HasFn): PlanId {
  if (has({ plan: 'pro' })) return 'pro';
  if (has({ plan: 'core' }) || has({ feature: '10_companion_limit' })) return 'core';
  return 'free';
}

/** Vapi accepts maxDurationSeconds in [10, 43200]. */
export const VAPI_MIN_DURATION_SECONDS = 10;
export const VAPI_MAX_DURATION_SECONDS = 43_200;

export interface SessionAllowance {
  allowed: boolean;
  plan: PlanId;
  usedSeconds: number;
  /** `null` = unlimited. */
  remainingSeconds: number | null;
  /** Hard cap passed to Vapi so the call ends server-side even if the tab misbehaves. */
  maxDurationSeconds: number;
  reason?: 'quota_exhausted';
}

export function computeSessionAllowance(params: {
  plan: PlanId;
  usedSeconds: number;
  companionDurationMinutes: number;
}): SessionAllowance {
  const { plan, usedSeconds } = params;
  const limits = PLANS[plan];
  const companionCap = Math.max(1, Math.round(params.companionDurationMinutes || 15)) * 60;

  const remainingSeconds = Number.isFinite(limits.monthlyMinutes)
    ? Math.max(0, limits.monthlyMinutes * 60 - usedSeconds)
    : null;

  if (remainingSeconds !== null && remainingSeconds < VAPI_MIN_DURATION_SECONDS) {
    return {
      allowed: false,
      plan,
      usedSeconds,
      remainingSeconds: 0,
      maxDurationSeconds: 0,
      reason: 'quota_exhausted',
    };
  }

  const cap = Math.min(companionCap, remainingSeconds ?? companionCap, VAPI_MAX_DURATION_SECONDS);

  return {
    allowed: true,
    plan,
    usedSeconds,
    remainingSeconds,
    maxDurationSeconds: Math.max(VAPI_MIN_DURATION_SECONDS, cap),
  };
}

/** First instant of the current calendar month in UTC (ISO string). */
export function startOfMonthUtc(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function canCreateCompanion(plan: PlanId, currentCount: number): boolean {
  return currentCount < PLANS[plan].companionLimit;
}
