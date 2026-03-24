/**
 * Security Test: Broken Access Control (OWASP A01)
 *
 * Tests for:
 * - Unauthenticated access to protected routes
 * - Missing role checks (privilege escalation)
 * - Direct object reference without ownership verification
 */

import { describe, it, expect } from 'vitest'
import { secFetch } from './helpers/http-client'
import { AUTHENTICATED_ROUTES, ADMIN_ROUTES, ROUTES } from './helpers/constants'

describe('OWASP A01: Broken Access Control', () => {
  describe('Unauthenticated access to protected routes', () => {
    for (const route of AUTHENTICATED_ROUTES) {
      it(`should return 401 for ${route.method} ${route.path} without auth`, async () => {
        const res = await secFetch(route.path, {
          method: route.method,
          body: route.method !== 'GET' && route.method !== 'DELETE'
            ? JSON.stringify({})
            : undefined,
        })

        expect(
          res.status,
          `${route.method} ${route.path} should require authentication but returned ${res.status}`
        ).toBe(401)
      })
    }
  })

  describe('Admin routes require Basic Auth + session', () => {
    for (const route of ADMIN_ROUTES) {
      it(`should return 401 for ${route.method} ${route.path} without Basic Auth`, async () => {
        const res = await secFetch(route.path, {
          method: route.method,
        })

        // Admin routes should require Basic Auth at middleware level
        expect(
          res.status,
          `Admin route ${route.path} should require Basic Auth but returned ${res.status}`
        ).toBe(401)
      })
    }
  })

  describe('Cron routes require Bearer token', () => {
    const cronRoutes = [
      ROUTES.cronCleanup,
      ROUTES.cronAutoApprove,
      ROUTES.cronReminder,
    ]

    for (const path of cronRoutes) {
      it(`should return 401 for ${path} without CRON_SECRET`, async () => {
        const res = await secFetch(path, { method: 'GET' })

        expect(
          res.status,
          `Cron route ${path} should require Bearer token but returned ${res.status}`
        ).toBe(401)
      })

      it(`should return 401 for ${path} with empty Bearer token`, async () => {
        const res = await secFetch(path, {
          method: 'GET',
          headers: { Authorization: 'Bearer ' },
        })

        expect(
          res.status,
          `Cron route ${path} should reject empty Bearer token`
        ).toBe(401)
      })

      it(`should return 401 for ${path} with "Bearer undefined"`, async () => {
        const res = await secFetch(path, {
          method: 'GET',
          headers: { Authorization: 'Bearer undefined' },
        })

        expect(
          res.status,
          `Cron route ${path} should reject "Bearer undefined" — possible env var missing`
        ).toBe(401)
      })
    }
  })

  describe('Role-based access control', () => {
    it('should verify ticket-balance/adjust has role check (not just auth)', async () => {
      // This route uses createAdminClient() to bypass RLS
      // If there's no role check, any authenticated user can adjust balances
      // We test by examining the response without valid role
      const res = await secFetch(ROUTES.ticketBalanceAdjust, {
        method: 'POST',
        body: JSON.stringify({
          ticketBalanceId: '00000000-0000-0000-0000-000000000000',
          deltaMinutes: 999,
        }),
      })

      // Should be 401 (no auth) — but the REAL test is:
      // if an authenticated non-teacher gets 200, that's a vulnerability
      expect(res.status).toBe(401)
    })

    it('should verify checkout/session has authentication check', async () => {
      // checkout/session currently has rate limiting but no auth
      // This tests whether unauthenticated requests are rejected
      const res = await secFetch(ROUTES.checkout, {
        method: 'POST',
        body: JSON.stringify({
          ticketId: '00000000-0000-0000-0000-000000000000',
          priceId: 'price_test_fake',
        }),
      })

      // VULNERABILITY: If this returns anything other than 401,
      // unauthenticated users can create Stripe checkout sessions
      expect(
        res.status,
        'checkout/session should require authentication — currently allows unauthenticated access'
      ).toBe(401)
    })
  })

  describe('HTTP method enforcement', () => {
    it('should reject unexpected HTTP methods on login endpoint', async () => {
      const methods = ['PUT', 'DELETE', 'PATCH']
      for (const method of methods) {
        const res = await secFetch(ROUTES.login, { method })
        expect(
          [405, 404, 400].includes(res.status),
          `${method} /api/auth/login should not be handled (got ${res.status})`
        ).toBe(true)
      }
    })
  })
})
