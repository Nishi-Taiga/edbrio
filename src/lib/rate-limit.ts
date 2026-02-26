/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 })
 *   // In your API route:
 *   const { success } = limiter.check(identifier)
 *   if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests per window */
  max: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max } = options
  const store = new Map<string, RateLimitEntry>()

  // Periodic cleanup every 60s to prevent memory leaks
  let cleanupTimer: ReturnType<typeof setInterval> | null = null

  function ensureCleanup() {
    if (cleanupTimer) return
    cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key)
      }
      if (store.size === 0 && cleanupTimer) {
        clearInterval(cleanupTimer)
        cleanupTimer = null
      }
    }, 60_000)
    // Allow process to exit even if timer is running
    if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
      cleanupTimer.unref()
    }
  }

  function check(identifier: string): { success: boolean; remaining: number } {
    const now = Date.now()
    const entry = store.get(identifier)

    if (!entry || now > entry.resetAt) {
      store.set(identifier, { count: 1, resetAt: now + windowMs })
      ensureCleanup()
      return { success: true, remaining: max - 1 }
    }

    entry.count++
    if (entry.count > max) {
      return { success: false, remaining: 0 }
    }

    return { success: true, remaining: max - entry.count }
  }

  return { check }
}

// Pre-configured limiters for different API routes
export const aiReportLimiter = createRateLimiter({ windowMs: 60_000, max: 10 })
export const emailLimiter = createRateLimiter({ windowMs: 60_000, max: 20 })
export const checkoutLimiter = createRateLimiter({ windowMs: 60_000, max: 5 })
