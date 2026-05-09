import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRateLimiter } from '@/lib/rate-limit'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 })

    const r1 = limiter.check('user1')
    expect(r1.success).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = limiter.check('user1')
    expect(r2.success).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = limiter.check('user1')
    expect(r3.success).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests exceeding the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 })

    limiter.check('user1')
    limiter.check('user1')
    const r3 = limiter.check('user1')

    expect(r3.success).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('resets after window expires', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 })

    limiter.check('user1')
    const blocked = limiter.check('user1')
    expect(blocked.success).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(60_001)

    const afterReset = limiter.check('user1')
    expect(afterReset.success).toBe(true)
    expect(afterReset.remaining).toBe(0)
  })

  it('tracks different identifiers independently', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 })

    const r1 = limiter.check('user1')
    const r2 = limiter.check('user2')

    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)

    // user1 is now blocked, user2 should also be blocked
    expect(limiter.check('user1').success).toBe(false)
    expect(limiter.check('user2').success).toBe(false)

    // user3 is still fine
    expect(limiter.check('user3').success).toBe(true)
  })

  it('returns correct remaining count', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 5 })

    expect(limiter.check('user1').remaining).toBe(4)
    expect(limiter.check('user1').remaining).toBe(3)
    expect(limiter.check('user1').remaining).toBe(2)
    expect(limiter.check('user1').remaining).toBe(1)
    expect(limiter.check('user1').remaining).toBe(0)
    expect(limiter.check('user1').remaining).toBe(0) // blocked
  })

  it('handles max=1 correctly', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 })

    const first = limiter.check('key')
    expect(first.success).toBe(true)
    expect(first.remaining).toBe(0)

    const second = limiter.check('key')
    expect(second.success).toBe(false)
  })
})
