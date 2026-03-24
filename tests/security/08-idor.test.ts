/**
 * Security Test: Insecure Direct Object References (OWASP A01 subset)
 *
 * Tests for:
 * - Accessing other users' resources via ID manipulation
 * - UUID enumeration resistance
 * - RLS enforcement at the API level
 */

import { describe, it, expect } from 'vitest'
import { secFetch } from './helpers/http-client'
import { ROUTES } from './helpers/constants'

describe('IDOR: Insecure Direct Object References', () => {
  describe('UUID format validation', () => {
    const uuidEndpoints = [
      { path: `${ROUTES.bookingReports}/not-a-uuid`, method: 'GET' },
      { path: `${ROUTES.bookingReports}/not-a-uuid`, method: 'PATCH' },
      { path: `${ROUTES.ticketBalanceAdjust}`, method: 'POST', body: { ticketBalanceId: 'not-a-uuid', deltaMinutes: 1 } },
      { path: `${ROUTES.ticketGrant}`, method: 'POST', body: { ticketId: 'not-a-uuid', studentProfileId: 'also-not-uuid' } },
    ]

    for (const endpoint of uuidEndpoints) {
      it(`should reject non-UUID IDs for ${endpoint.method} ${endpoint.path}`, async () => {
        const res = await secFetch(endpoint.path, {
          method: endpoint.method,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        })

        // Should be 400 (bad input) or 401 (no auth), never 500 (unhandled)
        expect(
          res.status,
          `${endpoint.method} ${endpoint.path} crashed with non-UUID input (got ${res.status})`
        ).not.toBe(500)
      })
    }
  })

  describe('Sequential ID guessing resistance', () => {
    it('should use UUIDs not sequential integers for resource IDs', async () => {
      // Try accessing resources with sequential numeric IDs
      const numericIds = ['1', '2', '100', '999']

      for (const id of numericIds) {
        const res = await secFetch(`${ROUTES.bookingReports}/${id}`, {
          method: 'GET',
        })

        // Should be 400/401/404, not 200 with data
        expect(
          res.status,
          `Numeric ID ${id} should not return data — use UUIDs`
        ).not.toBe(200)
      }
    })
  })

  describe('Cross-user data access prevention', () => {
    it('should not expose user data in error messages for invalid IDs', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000'

      const res = await secFetch(`${ROUTES.bookingReports}/${fakeUuid}`, {
        method: 'GET',
      })

      const text = await res.text()

      // Error response should not contain other users' data
      expect(text).not.toMatch(/@.*\.com/) // No email addresses
      expect(text).not.toMatch(/guardian_id|teacher_id/) // No foreign keys
      expect(text).not.toMatch(/password|hash|salt/) // No auth data
    })

    it('should return consistent responses for existing and non-existing resources', async () => {
      const existingLike = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      const nonExisting = '11111111-2222-3333-4444-555555555555'

      const [res1, res2] = await Promise.all([
        secFetch(`${ROUTES.bookingReports}/${existingLike}`, { method: 'GET' }),
        secFetch(`${ROUTES.bookingReports}/${nonExisting}`, { method: 'GET' }),
      ])

      // Both should return same status (401 without auth, or 404)
      // Different statuses could enable resource enumeration
      expect(
        res1.status,
        `Different response codes for different UUIDs enables enumeration (${res1.status} vs ${res2.status})`
      ).toBe(res2.status)
    })
  })

  describe('Admin user ID parameter injection', () => {
    it('should not allow accessing admin user details without admin auth', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      const res = await secFetch(`${ROUTES.adminUsers}/${fakeUserId}`, {
        method: 'GET',
      })

      // Admin routes require Basic Auth at middleware level
      expect(res.status).toBe(401)
    })
  })
})
