/**
 * Security Test: Server-Side Request Forgery (OWASP A10)
 *
 * Tests for:
 * - URL parameter manipulation to access internal services
 * - Redirect URL manipulation
 * - Callback URL injection
 */

import { describe, it, expect } from 'vitest'
import { secFetch } from './helpers/http-client'
import { ROUTES } from './helpers/constants'

describe('OWASP A10: SSRF', () => {
  describe('Redirect URL manipulation', () => {
    const maliciousUrls = [
      'https://evil.com',
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'http://[::1]/', // IPv6 localhost
      'http://127.0.0.1:5432/', // Local PostgreSQL
      'http://0.0.0.0/',
      'file:///etc/passwd',
      'gopher://localhost:6379/_INFO', // Redis
    ]

    it('should not follow arbitrary redirect URLs in auth callback', async () => {
      for (const url of maliciousUrls) {
        const res = await secFetch(
          `${ROUTES.callback}?code=fake&redirect_to=${encodeURIComponent(url)}`,
          { method: 'GET' }
        )

        // If the server redirects, it should only redirect to allowed domains
        if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
          const location = res.headers.get('location') || ''
          expect(
            location.includes('evil.com') ||
            location.includes('169.254') ||
            location.includes('[::1]') ||
            location.includes('127.0.0.1') ||
            location.startsWith('file:') ||
            location.startsWith('gopher:'),
            `Auth callback redirected to dangerous URL: ${location}`
          ).toBe(false)
        }
      }
    })

    it('should not allow open redirect via next param', async () => {
      const res = await secFetch(
        `/?next=${encodeURIComponent('https://evil.com/phishing')}`,
        { method: 'GET' }
      )

      if (res.status === 301 || res.status === 302 || res.status === 307) {
        const location = res.headers.get('location') || ''
        expect(
          location.includes('evil.com'),
          `Open redirect to evil.com detected via next param`
        ).toBe(false)
      }
    })
  })

  describe('Checkout success/cancel URL injection', () => {
    it('should not allow custom success_url in checkout session', async () => {
      // The checkout route constructs success_url server-side from NEXT_PUBLIC_APP_URL
      // But an attacker might try to inject a URL via other means
      const res = await secFetch(ROUTES.checkout, {
        method: 'POST',
        body: JSON.stringify({
          ticketId: '00000000-0000-0000-0000-000000000000',
          priceId: 'price_test',
          success_url: 'https://evil.com/steal-session',
          cancel_url: 'https://evil.com/phishing',
        }),
      })

      // Even if 401 (no auth), the server should not process injected URLs
      // Zod should strip these extra fields
      if (res.status === 200) {
        const body = await res.json()
        // If a session was created, verify the URLs are safe
        expect(body.success_url).not.toContain('evil.com')
      }
    })
  })

  describe('Pre-register confirmation token as URL component', () => {
    it('should not follow tokens that look like URLs', async () => {
      const urlTokens = [
        'http://evil.com',
        'https://169.254.169.254',
        '//evil.com',
      ]

      for (const token of urlTokens) {
        const res = await secFetch(
          `${ROUTES.preRegisterConfirm}?token=${encodeURIComponent(token)}`,
          { method: 'GET' }
        )

        // Token should be validated as UUID, rejecting URL-like values
        // Should redirect to home with error, not follow the URL
        if (res.status === 301 || res.status === 302 || res.status === 307) {
          const location = res.headers.get('location') || ''
          expect(
            location.includes('evil.com') || location.includes('169.254'),
            `Server followed URL-like token: ${token}`
          ).toBe(false)
        }
      }
    })
  })

  describe('Invite token SSRF', () => {
    it('should validate invite tokens as UUID only', async () => {
      const res = await secFetch(
        `${ROUTES.invitesValidate}?token=http://169.254.169.254/`,
        { method: 'GET' }
      )

      // Should be 400 (invalid UUID), not a server-side request
      expect(res.status).not.toBe(500)
      if (res.status === 301 || res.status === 302) {
        const location = res.headers.get('location') || ''
        expect(location).not.toContain('169.254')
      }
    })
  })
})
