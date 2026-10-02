import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory, per-IP fixed-window rate limiter.
 *
 * This runs per server instance, so it's not shared across regions or
 * restarts — it won't stop a determined, distributed attacker. What it does
 * stop is the common case: a script or bot hammering a route that calls a
 * paid third-party API (InferX, CloudConvert, ...) from a single source.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodically drop old buckets so this map can't grow without bound.
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

let lastSweep = 0

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Returns `null` if the request is within limits, or a 429 NextResponse to
 * return immediately if it isn't.
 */
export function checkRateLimit(
  request: NextRequest,
  { limit, windowMs, key }: { limit: number; windowMs: number; key: string },
): NextResponse | null {
  const now = Date.now()
  if (now - lastSweep > windowMs) {
    sweep(now)
    lastSweep = now
  }

  const id = `${key}:${getClientIp(request)}`
  const existing = buckets.get(id)

  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests — please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  existing.count += 1
  return null
}
