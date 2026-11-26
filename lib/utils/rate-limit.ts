// Lightweight in-memory rate limiter for public API routes (contact,
// newsletter). Correct for a single server process (our VPS deployment); with
// several instances, swap in a shared store such as Redis.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Above this many tracked keys, expired ones are swept to bound memory. */
const SWEEP_THRESHOLD = 1_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();

  if (buckets.size > SWEEP_THRESHOLD) {
    buckets.forEach((b, k) => {
      if (b.resetAt < now) buckets.delete(k);
    });
  }

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP.
 *
 * `CF-Connecting-IP` is trusted only with TRUST_CLOUDFLARE_IP=true, i.e. when
 * the app can be reached through the Cloudflare proxy alone (the VPS setup).
 * On Railway the app also answers on its *.up.railway.app address, where a
 * visitor could send that header themselves.
 *
 * Otherwise use the LAST X-Forwarded-For entry: it is added by the platform's
 * own proxy, whereas earlier entries can be forged by the visitor.
 */
export function getClientIp(request: Request): string {
  if (process.env.TRUST_CLOUDFLARE_IP === 'true') {
    const cf = request.headers.get('cf-connecting-ip');
    if (cf) return cf.trim();
  }
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',').pop()!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
