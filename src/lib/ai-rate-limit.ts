// ─────────────────────────────────────────────────────────────────────────────
// AI Krishi Mitra — Per-Farmer Rate Limiter
// Max 10 AI questions per farmer per 24 hours
// In-memory store (resets on server restart — acceptable for daily limits)
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const aiRateLimitStore = new Map<string, RateLimitEntry>();

const MAX_QUESTIONS_PER_DAY = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function checkAIRateLimit(farmerId: string): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
} {
  const now = Date.now();
  const entry = aiRateLimitStore.get(farmerId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    aiRateLimitStore.set(farmerId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_QUESTIONS_PER_DAY - 1, resetInMs: WINDOW_MS };
  }

  if (entry.count >= MAX_QUESTIONS_PER_DAY) {
    const resetInMs = WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetInMs };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_QUESTIONS_PER_DAY - entry.count,
    resetInMs: WINDOW_MS - (now - entry.windowStart),
  };
}
