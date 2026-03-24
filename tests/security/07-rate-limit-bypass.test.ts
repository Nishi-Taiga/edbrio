/**
 * Security Test: Rate Limit Bypass (OWASP A04 related)
 *
 * Tests for:
 * - X-Forwarded-For header spoofing to bypass IP-based rate limits
 * - Rate limits actually enforced on critical endpoints
 * - In-memory rate limit weaknesses
 */

import { describe, it, expect } from 'vitest'
import { secFetch, spoofedIpFetch, rapidFire, randomIp } from './helpers/http-client'
import { ROUTES } from './helpers/constants'

describe('Rate Limit Bypass', () => {
  describe('X-Forwarded-For spoofing', () => {
    it('should NOT allow rate limit bypass via X-Forwarded-For header spoofing', async () => {
      // Strategy: Send many requests with different spoofed IPs
      // If rate limit is bypassed, all requests return non-429
      const path = ROUTES.contact
      const results: number[] = []

      // Send 10 requests each with a different spoofed IP
      for (let i = 0; i < 10; i++) {
        const res = await spoofedIpFetch(path, randomIp(), {
          method: 'POST',
          body: JSON.stringify({
            name: 'Security Test',
            email: `test${i}@example.com`,
            message: 'Rate limit bypass test',
          }),
        })
        results.push(res.status)
      }

      // If all requests succeed (no 429), the rate limit was bypassed
      const successCount = results.filter(s => s !== 429).length

      // contactLimiter allows 3 per 5 min — if more than 3 succeed,
      // the spoofed IP is being used as the rate limit key
      expect(
        successCount,
        `Rate limit bypassed: ${successCount}/10 requests succeeded with spoofed IPs. ` +
        'Server should use x-real-ip or x-vercel-forwarded-for instead of x-forwarded-for'
      ).toBeLessThanOrEqual(3)
    })
  })

  describe('Rate limits enforced on critical endpoints', () => {
    it('should enforce rate limit on contact form', async () => {
      // contactLimiter: 3 requests per 5 minutes
      const statuses = await rapidFire(ROUTES.contact, 6, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Rate Test',
          email: 'rate@test.com',
          message: 'Testing rate limit enforcement',
        }),
      })

      const has429 = statuses.some(s => s === 429)
      expect(
        has429,
        `Contact form should be rate limited (got statuses: ${statuses.join(', ')})`
      ).toBe(true)
    })

    it('should enforce rate limit on pre-register endpoint', async () => {
      // preRegisterLimiter: 3 requests per 5 minutes
      const statuses = await rapidFire(ROUTES.preRegister, 6, {
        method: 'POST',
        body: JSON.stringify({ email: 'ratetest@example.com' }),
      })

      const has429 = statuses.some(s => s === 429)
      expect(
        has429,
        `Pre-register should be rate limited (got statuses: ${statuses.join(', ')})`
      ).toBe(true)
    })

    it('should enforce rate limit on login endpoint', async () => {
      // loginRateLimiter: 20 requests per minute
      const statuses = await rapidFire(ROUTES.login, 25, {
        method: 'POST',
        body: JSON.stringify({
          email: 'ratelimit@test.com',
          password: 'wrongpassword',
        }),
      })

      const has429 = statuses.some(s => s === 429)
      expect(
        has429,
        `Login should be rate limited after 20 requests (got statuses: ${statuses.join(', ')})`
      ).toBe(true)
    })
  })

  describe('Rate limit response format', () => {
    it('should return proper 429 status with error message', async () => {
      // Exhaust the rate limit first
      for (let i = 0; i < 5; i++) {
        await secFetch(ROUTES.contact, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Format Test',
            email: 'format@test.com',
            message: 'Rate limit format test',
          }),
        })
      }

      // Next request should be 429
      const res = await secFetch(ROUTES.contact, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Format Test',
          email: 'format@test.com',
          message: 'Should be rate limited',
        }),
      })

      if (res.status === 429) {
        const body = await res.json()
        // Should have a user-friendly error message, not internal details
        expect(body.error).toBeTruthy()
        expect(body.error).not.toMatch(/Map|limiter|internal/)
      }
    })
  })

  describe('Rate limit does not leak timing information', () => {
    it('should not reveal exact reset time in response', async () => {
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await secFetch(ROUTES.contact, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Timing Test',
            email: 'timing@test.com',
            message: 'Timing test',
          }),
        })
      }

      const res = await secFetch(ROUTES.contact, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Timing Test',
          email: 'timing@test.com',
          message: 'Timing check',
        }),
      })

      if (res.status === 429) {
        const text = await res.text()
        // Should not reveal the exact millisecond when the limit resets
        expect(text).not.toMatch(/resetAt|reset_at|retryAfter/)
        // Retry-After header is acceptable (standard practice)
      }
    })
  })
})
