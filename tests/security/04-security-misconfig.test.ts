/**
 * Security Test: Security Misconfiguration (OWASP A05)
 *
 * Tests for:
 * - Missing or weak security headers
 * - CSP policy weaknesses
 * - Debug/dev endpoints accessible in production
 * - Error messages leaking internal details
 * - Source maps or sensitive files accessible
 */

import { describe, it, expect } from 'vitest'
import { secFetch } from './helpers/http-client'

describe('OWASP A05: Security Misconfiguration', () => {
  describe('Security headers present on all responses', () => {
    const testPaths = ['/', '/api/contact']

    for (const path of testPaths) {
      it(`should have HSTS header on ${path}`, async () => {
        const res = await secFetch(path, { method: 'GET' })
        const hsts = res.headers.get('strict-transport-security')
        expect(hsts, `Missing HSTS header on ${path}`).toBeTruthy()
        expect(hsts).toContain('max-age=')
        expect(hsts).toContain('includeSubDomains')
      })

      it(`should have X-Frame-Options: DENY on ${path}`, async () => {
        const res = await secFetch(path, { method: 'GET' })
        const xfo = res.headers.get('x-frame-options')
        expect(xfo, `Missing X-Frame-Options on ${path}`).toBe('DENY')
      })

      it(`should have X-Content-Type-Options: nosniff on ${path}`, async () => {
        const res = await secFetch(path, { method: 'GET' })
        const xcto = res.headers.get('x-content-type-options')
        expect(xcto, `Missing X-Content-Type-Options on ${path}`).toBe('nosniff')
      })

      it(`should have Referrer-Policy on ${path}`, async () => {
        const res = await secFetch(path, { method: 'GET' })
        const rp = res.headers.get('referrer-policy')
        expect(rp, `Missing Referrer-Policy on ${path}`).toBeTruthy()
      })

      it(`should have Permissions-Policy on ${path}`, async () => {
        const res = await secFetch(path, { method: 'GET' })
        const pp = res.headers.get('permissions-policy')
        expect(pp, `Missing Permissions-Policy on ${path}`).toBeTruthy()
      })

      it(`should have Content-Security-Policy on ${path}`, async () => {
        const res = await secFetch(path, { method: 'GET' })
        const csp = res.headers.get('content-security-policy')
        expect(csp, `Missing CSP on ${path}`).toBeTruthy()
      })
    }
  })

  describe('CSP policy strength', () => {
    it('should not have unsafe-eval in CSP (weakens XSS protection)', async () => {
      const res = await secFetch('/', { method: 'GET' })
      const csp = res.headers.get('content-security-policy') || ''

      // This is a known issue — GTM requires unsafe-eval
      // Flag it as a finding even if it's a known trade-off
      const hasUnsafeEval = csp.includes("'unsafe-eval'")
      expect(
        hasUnsafeEval,
        'CSP contains unsafe-eval which significantly weakens XSS protection'
      ).toBe(false)
    })

    it('should not have wildcard (*) in script-src', async () => {
      const res = await secFetch('/', { method: 'GET' })
      const csp = res.headers.get('content-security-policy') || ''

      // Extract script-src directive
      const scriptSrc = csp.match(/script-src\s+([^;]+)/)?.[1] || ''
      expect(
        scriptSrc.includes(' * ') || scriptSrc.trim().endsWith('*'),
        'CSP script-src should not contain wildcard'
      ).toBe(false)
    })

    it('should have frame-ancestors directive in CSP', async () => {
      const res = await secFetch('/', { method: 'GET' })
      const csp = res.headers.get('content-security-policy') || ''

      // frame-ancestors or X-Frame-Options should prevent clickjacking
      const hasFrameAncestors = csp.includes('frame-ancestors')
      const hasXFrameOptions = res.headers.get('x-frame-options') === 'DENY'
      expect(
        hasFrameAncestors || hasXFrameOptions,
        'Missing clickjacking protection (frame-ancestors or X-Frame-Options)'
      ).toBe(true)
    })
  })

  describe('Sensitive file access', () => {
    const sensitiveFiles = [
      '/.env',
      '/.env.local',
      '/.env.production',
      '/api/.env',
      '/.git/config',
      '/.git/HEAD',
      '/next.config.ts',
      '/next.config.js',
      '/package.json',
      '/tsconfig.json',
      '/.claude/settings.json',
    ]

    for (const file of sensitiveFiles) {
      it(`should not expose ${file}`, async () => {
        const res = await secFetch(file, { method: 'GET' })

        // Should be 404 or redirect, never 200 with content
        if (res.status === 200) {
          const text = await res.text()
          // Check if it returned actual file contents (not a Next.js page)
          const looksLikeFile = text.includes('SUPABASE') ||
            text.includes('SECRET') ||
            text.includes('"dependencies"') ||
            text.includes('[core]') ||
            text.includes('ref:')

          expect(
            looksLikeFile,
            `${file} appears to be accessible and contains sensitive content`
          ).toBe(false)
        }
      })
    }
  })

  describe('Error message information leakage', () => {
    it('should not leak stack traces in API errors', async () => {
      // Send malformed JSON to trigger a parse error
      const res = await secFetch('/api/contact', {
        method: 'POST',
        body: '{invalid json',
        raw: true,
        headers: { 'Content-Type': 'application/json' },
      })

      const text = await res.text()
      expect(text, 'Error response should not contain stack trace').not.toMatch(/at\s+\w+\s+\(/)
      expect(text, 'Error response should not contain file paths').not.toMatch(/\/src\/|\/app\/|node_modules/)
      expect(text, 'Error response should not contain "Error:" prefix from Node').not.toMatch(/^Error:/)
    })

    it('should not expose Supabase connection details in errors', async () => {
      const res = await secFetch('/api/booking-reports', {
        method: 'POST',
        body: JSON.stringify({ invalid: true }),
      })

      const text = await res.text()
      expect(text).not.toMatch(/supabase\.co/)
      expect(text).not.toMatch(/postgresql:\/\//)
      expect(text).not.toMatch(/postgres:\/\//)
    })
  })

  describe('Debug endpoints', () => {
    it('should not expose Next.js internal routes', async () => {
      const debugPaths = [
        '/_next/data/',
        '/api/__nextjs_original-stack-frame',
      ]

      for (const path of debugPaths) {
        const res = await secFetch(path, { method: 'GET' })
        // In production, these should be 404 or not leak info
        if (res.status === 200) {
          const text = await res.text()
          expect(
            text.includes('sourceStackFrame') || text.includes('originalCodeFrame'),
            `Debug endpoint ${path} is leaking source code information`
          ).toBe(false)
        }
      }
    })
  })

  describe('Server version disclosure', () => {
    it('should not expose server software version in headers', async () => {
      const res = await secFetch('/', { method: 'GET' })

      const server = res.headers.get('server')
      const powered = res.headers.get('x-powered-by')

      // x-powered-by should not be set (Next.js removes it by default)
      expect(powered, 'X-Powered-By header should not be set').toBeNull()

      // Server header should not reveal version details
      if (server) {
        expect(server).not.toMatch(/\d+\.\d+/)
      }
    })
  })
})
