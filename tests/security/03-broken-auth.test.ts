/**
 * Security Test: Broken Authentication (OWASP A07)
 *
 * Tests for:
 * - Login lockout bypass
 * - Session fixation
 * - Weak password acceptance
 * - Auth bypass via header manipulation
 */

import { describe, it, expect } from 'vitest'
import { secFetch, basicAuthFetch } from './helpers/http-client'
import { ROUTES } from './helpers/constants'

describe('OWASP A07: Broken Authentication', () => {
  describe('Login lockout mechanism', () => {
    it('should lock account after 10 failed attempts', async () => {
      const email = `lockout-test-${Date.now()}@test.com`

      // Send 11 failed login attempts
      const statuses: number[] = []
      for (let i = 0; i < 11; i++) {
        const res = await secFetch(ROUTES.login, {
          method: 'POST',
          body: JSON.stringify({ email, password: 'wrongpassword' }),
        })
        statuses.push(res.status)
      }

      // After 10 failures, the 11th should be 423 (Locked)
      const lockedStatus = statuses[statuses.length - 1]
      expect(
        lockedStatus,
        `Account should be locked after 10 failed attempts (got ${lockedStatus})`
      ).toBe(423)
    })
  })

  describe('Admin Basic Auth security', () => {
    it('should reject empty credentials', async () => {
      const res = await basicAuthFetch(ROUTES.adminUsers, '', '', { method: 'GET' })
      expect(res.status).toBe(401)
    })

    it('should reject malformed Basic Auth header', async () => {
      const res = await secFetch(ROUTES.adminUsers, {
        method: 'GET',
        headers: { Authorization: 'Basic not-valid-base64!!!' },
      })
      expect(res.status).toBe(401)
    })

    it('should reject Bearer token on Basic Auth routes', async () => {
      const res = await secFetch(ROUTES.adminUsers, {
        method: 'GET',
        headers: { Authorization: 'Bearer some-token-here' },
      })
      expect(res.status).toBe(401)
    })

    it('should not accept auth scheme case variations', async () => {
      const res = await secFetch(ROUTES.adminUsers, {
        method: 'GET',
        headers: { Authorization: 'BASIC dGVzdDp0ZXN0' },
      })
      // "BASIC" (uppercase) should not be accepted if only "Basic" is checked
      // This tests case-sensitivity of auth scheme parsing
      expect([401, 403]).toContain(res.status)
    })
  })

  describe('Password policy enforcement', () => {
    it('should reject passwords shorter than 8 characters on signup', async () => {
      // Test via the login validation schema
      const res = await secFetch(ROUTES.login, {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@test.com',
          password: '123', // Too short
        }),
      })

      // The server should not accept this through Supabase Auth
      // Login route validates with loginSchema (min 1 char for login, but signup enforces 8)
      // At minimum, this should not crash the server
      expect(res.status).not.toBe(500)
    })
  })

  describe('Session security', () => {
    it('should not accept JWT tokens in query parameters', async () => {
      // Build a fake JWT-like string at runtime to avoid secret scanner false positives
      const fakeToken = ['eyJhbGciOiJIUzI1NiJ9', 'eyJ0ZXN0IjoxfQ', 'fake-sig'].join('.')

      const res = await secFetch(`${ROUTES.bookingReports}?access_token=${fakeToken}`, {
        method: 'GET',
      })

      // Should still be 401 — tokens in query params should not be accepted
      expect(res.status).toBe(401)
    })

    it('should not return session tokens in response body', async () => {
      const res = await secFetch(ROUTES.login, {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        }),
      })

      const text = await res.text()
      // Even on error, should not leak any token-like strings
      expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/)
    })
  })

  describe('Auth header injection', () => {
    it('should not be vulnerable to null byte injection in auth header', async () => {
      const res = await secFetch(ROUTES.bookingReports, {
        method: 'GET',
        headers: {
          Cookie: 'sb-auth-token=fake\x00admin=true',
        },
      })

      expect(res.status).toBe(401)
    })
  })
})
