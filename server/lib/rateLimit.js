// Fixed-window, in-memory rate limiter.
// Good for local dev and a single long-running server. On serverless hosts
// (Vercel) each instance has its own memory, so swap this for a shared store
// such as Upstash Redis (@upstash/ratelimit) before relying on it.

const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map();

export function checkRateLimit(keys, limit) {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [k, b] of buckets) if (now - b.start > WINDOW_MS) buckets.delete(k);
  }
  let retryAfter = 0;
  for (const key of keys) {
    if (!key) continue;
    const b = buckets.get(key);
    if (b && now - b.start < WINDOW_MS && b.count >= limit) {
      retryAfter = Math.max(retryAfter, Math.ceil((b.start + WINDOW_MS - now) / 1000));
    }
  }
  if (retryAfter) return { ok: false, retryAfter };
  for (const key of keys) {
    if (!key) continue;
    const b = buckets.get(key);
    if (!b || now - b.start >= WINDOW_MS) buckets.set(key, { start: now, count: 1 });
    else b.count++;
  }
  return { ok: true };
}
