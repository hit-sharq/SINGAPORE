import { NextRequest, NextResponse } from 'next/server'
import { sha256 } from '@/lib/security'

/**
 * In-process rate limiting.
 *
 * Deliberately no third-party service: this runs inside the app. The tradeoff
 * is that buckets live in memory, so a limit resets when the process restarts
 * and is per-instance. That is the right trade for a single self-hosted server
 * and it is why Cloudflare-style edge limiting is not needed here.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Stop the map growing without bound on a long-running process.
const MAX_BUCKETS = 10_000

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number; retryAfterSeconds: number }

/**
 * Count one hit against a named limit for a given identifier.
 * `key` is usually an IP address, or an IP plus a route.
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()
  sweep(now)

  // Hash the key so a bucket map is not holding raw client addresses in memory.
  const bucketKey = sha256(key)
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs
    buckets.set(bucketKey, { count: 1, resetAt })
    return { ok: true, remaining: options.limit - 1, resetAt }
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return { ok: true, remaining: options.limit - existing.count, resetAt: existing.resetAt }
}

/** Best-effort client address, honouring a proxy header when one is present. */
export function clientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Standard limits, named for where they are used. Auth endpoints are strict
 * because they are the ones worth guessing; reads are generous because staff
 * are working normally when they trip them.
 */
export const LIMITS = {
  signIn: { limit: 10, windowMs: 15 * 60 * 1000 },
  signUp: { limit: 5, windowMs: 60 * 60 * 1000 },
  webhook: { limit: 120, windowMs: 60 * 1000 },
  write: { limit: 300, windowMs: 60 * 1000 },
  read: { limit: 1200, windowMs: 60 * 1000 },
  export: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const

/**
 * Check a limit and return a 429 response when it is exceeded.
 * Returns null when the request may proceed, so callers can write:
 *
 *   const limited = enforceRateLimit(request, 'signIn', 'sign-in')
 *   if (limited) return limited
 */
export function enforceRateLimit(
  request: NextRequest,
  limit: { limit: number; windowMs: number },
  bucket: string,
): NextResponse | null {
  const identifier = `${bucket}:${clientIdentifier(request)}`
  const result = rateLimit(identifier, limit)

  if (result.ok) {
    return null
  }

  return NextResponse.json(
    { error: 'Too many requests. Please wait and try again.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(limit.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
      },
    },
  )
}

/** Test seam: clears all buckets. */
export function resetRateLimits() {
  buckets.clear()
}
