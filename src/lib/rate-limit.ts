/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * This is intentionally NOT Redis-backed — the app has one user and runs on
 * free-tier infra (spec §26), so per-instance in-memory state is sufficient.
 * On Vercel serverless this resets per cold start, which is an acceptable
 * trade-off for a single-user panel; swap for a Redis/Upstash-backed limiter
 * if this is ever deployed multi-instance.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Sensible defaults for the endpoints that need them.
export const RATE_LIMITS = {
  publish: { limit: 10, windowMs: 60_000 }, // 10 publish attempts / minute
  smtpTest: { limit: 5, windowMs: 60_000 },
  campaignSend: { limit: 3, windowMs: 60_000 },
  socialConnect: { limit: 10, windowMs: 60_000 },
};
