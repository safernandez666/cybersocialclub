/**
 * In-memory rate limiter keyed by an arbitrary string (email, jti, etc).
 * Used in addition to middleware IP rate limits — middleware can't see request
 * bodies, so per-email limits live here.
 *
 * Note: process-local. Multiple Vercel instances each have their own counter,
 * which is acceptable for a 5/15min limit (worst case is N×5 attempts per
 * window, which is still bounded). For stricter guarantees move this to Redis.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const stores: Record<string, Map<string, Entry>> = {};

function getStore(name: string): Map<string, Entry> {
  let store = stores[name];
  if (!store) {
    store = new Map();
    stores[name] = store;
  }
  return store;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
}

export function consumeRateLimit(
  storeName: string,
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const store = getStore(storeName);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const fresh = { count: 1, resetAt: now + windowMs };
    store.set(key, fresh);
    return { limited: false, remaining: maxRequests - 1, resetAt: fresh.resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { limited: entry.count > maxRequests, remaining, resetAt: entry.resetAt };
}

// Periodic GC. Single interval per process.
const GC_KEY = "__verify_rate_limit_gc__" as const;
type GlobalWithGc = typeof globalThis & { [GC_KEY]?: NodeJS.Timeout };
const g = globalThis as GlobalWithGc;
if (!g[GC_KEY]) {
  g[GC_KEY] = setInterval(() => {
    const now = Date.now();
    for (const store of Object.values(stores)) {
      for (const [k, v] of store) {
        if (now > v.resetAt) store.delete(k);
      }
    }
  }, 60_000);
}
