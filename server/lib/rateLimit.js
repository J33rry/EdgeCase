// Rate limiting for /api/tutor.
//
// With UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set, counts live in
// Upstash Redis (sliding window), so every serverless instance shares them.
// Without them, or if Redis errors, it falls back to an in-memory fixed
// window: fine for local dev, and it keeps the tutor up during a Redis outage.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60 * 60 * 1000;
const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redis;
const limiters = new Map(); // limit -> Ratelimit

function getLimiter(limit) {
  if (!limiters.has(limit)) {
    redis ??= Redis.fromEnv();
    limiters.set(
      limit,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, "1 h"),
        prefix: "edgecase:rl",
        timeout: 2000, // the library lets the request through if Redis is this slow
      }),
    );
  }
  return limiters.get(limit);
}

let warned = false;
function warnOnce(msg, err) {
  if (warned) return;
  warned = true;
  console.warn(msg, err?.message || "");
}

/**
 * @param {(string|false|null|undefined)[]} keys  e.g. ["ip:1.2.3.4", "id:<install>"]; falsy keys are skipped
 * @param {number} limit  requests allowed per key per hour
 * @returns {Promise<{ ok: boolean, retryAfter?: number }>} retryAfter in seconds
 */
export async function checkRateLimit(keys, limit) {
  const ids = keys.filter(Boolean);
  if (!hasRedis) {
    warnOnce("Upstash Redis isn't configured; using in-memory rate limiting.");
    return checkInMemory(ids, limit);
  }
  try {
    const limiter = getLimiter(limit);
    const results = await Promise.all(ids.map((id) => limiter.limit(id)));
    if (results.every((r) => r.success)) return { ok: true };
    const reset = Math.max(...results.filter((r) => !r.success).map((r) => r.reset));
    return { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (err) {
    warnOnce("Redis rate limiting failed; falling back to in-memory.", err);
    return checkInMemory(ids, limit);
  }
}

// ---- In-memory fallback (fixed window) ------------------------------------

const buckets = new Map();

function checkInMemory(keys, limit) {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [k, b] of buckets) if (now - b.start > WINDOW_MS) buckets.delete(k);
  }
  let retryAfter = 0;
  for (const key of keys) {
    const b = buckets.get(key);
    if (b && now - b.start < WINDOW_MS && b.count >= limit) {
      retryAfter = Math.max(retryAfter, Math.ceil((b.start + WINDOW_MS - now) / 1000));
    }
  }
  if (retryAfter) return { ok: false, retryAfter };
  for (const key of keys) {
    const b = buckets.get(key);
    if (!b || now - b.start >= WINDOW_MS) buckets.set(key, { start: now, count: 1 });
    else b.count++;
  }
  return { ok: true };
}
