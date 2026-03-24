/**
 * Security Test: Sensitive Data Exposure (OWASP A02)
 *
 * Tests for:
 * - API keys or secrets in responses
 * - Internal error details leaking to client
 * - PII exposure in error messages
 * - Verbose error responses
 */

import { describe, it, expect } from 'vitest'
import { secFetch } from './helpers/http-client'
import { ROUTES } from './helpers/constants'

describe('OWASP A02: Sensitive Data Exposure', () => {
  // Patterns that should NEVER appear in any API response
  const sensitivePatterns = [
    { pattern: /sk_live_[A-Za-z0-9]+/, name: 'Stripe live secret key' },
    { pattern: /sk_test_[A-Za-z0-9]+/, name: 'Stripe test secret key' },
    { pattern: /whsec_[A-Za-z0-9]+/, name: 'Stripe webhook secret' },
    { pattern: /re_[A-Za-z0-9]{20,}/, name: 'Resend API key' },
    { pattern: /sk-ant-[A-Za-z0-9]+/, name: 'Anthropic API key' },
    { pattern: /eyJhbGciOi[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/, name: 'JWT token' },
    { pattern: /SUPABASE_SERVICE_ROLE_KEY/, name: 'Service role key reference' },
    { pattern: /postgresql:\/\//, name: 'PostgreSQL connection string' },
    { pattern: /postgres:\/\//, name: 'Postgres connection string' },
  ]

  describe('No secrets in error responses', () => {
    const errorEndpoints = [
      { path: ROUTES.contact, method: 'POST', body: {} },
      { path: ROUTES.login, method: 'POST', body: { email: 'x', password: 'y' } },
      { path: ROUTES.preRegister, method: 'POST', body: {} },
      { path: ROUTES.checkout, method: 'POST', body: {} },
      { path: ROUTES.bookingReports, method: 'POST', body: {} },
      { path: ROUTES.ticketBalanceAdjust, method: 'POST', body: {} },
      { path: ROUTES.aiReport, method: 'POST', body: {} },
    ]

    for (const endpoint of errorEndpoints) {
      it(`should not leak secrets in error response from ${endpoint.method} ${endpoint.path}`, async () => {
        const res = await secFetch(endpoint.path, {
          method: endpoint.method,
          body: JSON.stringify(endpoint.body),
        })

        const text = await res.text()

        for (const { pattern, name } of sensitivePatterns) {
          expect(
            text,
            `${name} found in error response from ${endpoint.path}`
          ).not.toMatch(pattern)
        }
      })
    }
  })

  describe('No internal paths in error responses', () => {
    it('should not expose file system paths in any error response', async () => {
      // Trigger various error conditions
      const badRequests = [
        { path: ROUTES.contact, method: 'POST', body: null },
        { path: ROUTES.login, method: 'POST', body: 'not-json' },
        { path: ROUTES.checkout, method: 'POST', body: { invalid: true } },
      ]

      for (const req of badRequests) {
        const res = await secFetch(req.path, {
          method: req.method,
          body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
          ...(typeof req.body === 'string' ? { raw: true, headers: { 'Content-Type': 'application/json' } } : {}),
        })

        const text = await res.text()

        // Should not contain file paths
        expect(text).not.toMatch(/[A-Z]:\\Users\\/) // Windows paths
        expect(text).not.toMatch(/\/home\/|\/var\/|\/usr\//) // Unix paths
        expect(text).not.toMatch(/node_modules\//) // Node module paths
        expect(text).not.toMatch(/at\s+\w+\s+\(/) // Stack trace frames
      }
    })
  })

  describe('Cron endpoint error message leakage', () => {
    it('should not expose internal error details from cron endpoints', async () => {
      // Cron endpoints currently return error.message in responses
      const cronPaths = [
        ROUTES.cronCleanup,
        ROUTES.cronAutoApprove,
        ROUTES.cronReminder,
      ]

      for (const path of cronPaths) {
        // Call without auth to trigger an error path
        const res = await secFetch(path, { method: 'GET' })
        const text = await res.text()

        // Even the auth error should not leak internal details
        for (const { pattern, name } of sensitivePatterns) {
          expect(
            text,
            `${name} found in cron error response from ${path}`
          ).not.toMatch(pattern)
        }

        // Should not contain Supabase-specific error messages
        expect(text).not.toMatch(/supabase\.co/)
        expect(text).not.toMatch(/relation ".*" does not exist/)
        expect(text).not.toMatch(/permission denied for table/)
      }
    })
  })

  describe('No PII in public responses', () => {
    it('should not expose email addresses in unauthenticated API responses', async () => {
      const publicPaths = [
        { path: ROUTES.areas, method: 'GET' },
        { path: ROUTES.contact, method: 'POST', body: { name: 'Test', email: 'x@x.com', message: 'test' } },
      ]

      for (const req of publicPaths) {
        const res = await secFetch(req.path, {
          method: req.method,
          body: 'body' in req ? JSON.stringify(req.body) : undefined,
        })

        const text = await res.text()

        // Should not contain other users' email addresses
        // (the submitted email in contact form response is OK)
        expect(text).not.toMatch(/admin@|teacher@|guardian@/)
      }
    })
  })

  describe('Response header information leakage', () => {
    it('should not expose server technology details in headers', async () => {
      const res = await secFetch('/', { method: 'GET' })

      // Check for revealing headers
      const xPoweredBy = res.headers.get('x-powered-by')
      expect(xPoweredBy, 'X-Powered-By should not be set').toBeNull()

      // Server header should not reveal version
      const server = res.headers.get('server')
      if (server) {
        expect(server).not.toMatch(/Next\.js|Node\.js|Express/)
        expect(server).not.toMatch(/\d+\.\d+\.\d+/)
      }
    })
  })

  describe('CORS configuration', () => {
    it('should not allow arbitrary origins', async () => {
      const res = await secFetch(ROUTES.contact, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil.com',
          'Access-Control-Request-Method': 'POST',
        },
      })

      const allowOrigin = res.headers.get('access-control-allow-origin')
      if (allowOrigin) {
        expect(
          allowOrigin,
          'CORS allows arbitrary origins'
        ).not.toBe('*')
        expect(
          allowOrigin,
          'CORS reflects attacker origin'
        ).not.toBe('https://evil.com')
      }
    })
  })
})
